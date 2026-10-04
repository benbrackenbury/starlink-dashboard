"use client";

import { useEffect, useRef, useState } from "react";
import type { SightingResult } from "@/lib/sightings";
import { formatLocalWhen, formatUtcStamp } from "@/lib/format";
import { pressProps } from "@/lib/press";
import { patchQuery } from "@/lib/query";

const STORAGE_KEY = "starlink-train-location";

function readStoredCoords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { lat?: number; lon?: number };
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      return { lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    /* ignore bad localStorage */
  }
  return null;
}

export function TrainSightingsPanel({
  initialLat = "",
  initialLon = "",
}: {
  initialLat?: string;
  initialLon?: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const inflight = useRef(false);
  const [lat, setLat] = useState(initialLat);
  const [lon, setLon] = useState(initialLon);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<SightingResult | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function runLookup(nextLat: number, nextLon: number) {
    if (inflight.current) return;
    inflight.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trains?lat=${encodeURIComponent(nextLat)}&lon=${encodeURIComponent(nextLon)}`,
      );
      const body = (await res.json()) as SightingResult & { error?: string };
      if (!res.ok) {
        setResult(null);
        setError(
          body.error
            ? `${body.error} Check latitude and longitude, then try Find Trains again.`
            : "Lookup failed. Check latitude and longitude, then try Find Trains again.",
        );
        return;
      }
      saveCoords(nextLat, nextLon);
      setResult(body);
    } catch {
      setResult(null);
      setError(
        "Lookup failed. Check your connection, then try Find Trains again.",
      );
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const fromUrl =
      initialLat && initialLon
        ? { lat: Number(initialLat), lon: Number(initialLon) }
        : null;
    const stored = fromUrl?.lat != null && Number.isFinite(fromUrl.lat)
      ? fromUrl
      : readStoredCoords();
    if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lon)) {
      setLat(String(stored.lat));
      setLon(String(stored.lon));
    }

    const node = form.current;
    if (!node || !stored || !Number.isFinite(stored.lat)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void runLookup(stored.lat, stored.lon);
      },
      { rootMargin: "800px" },
    );
    io.observe(node);
    return () => io.disconnect();
    // seed once from URL or localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error || geoError) errorRef.current?.focus();
  }, [error, geoError]);

  function saveCoords(nextLat: number, nextLon: number) {
    setLat(String(nextLat));
    setLon(String(nextLon));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: nextLat, lon: nextLon }),
    );
    patchQuery({ lat: String(nextLat), lon: String(nextLon) });
  }

  function useDeviceLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(
        "This browser will not share a device location. Type latitude and longitude instead.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(4));
        const nextLon = Number(pos.coords.longitude.toFixed(4));
        saveCoords(nextLat, nextLon);
        setLocating(false);
        void runLookup(nextLat, nextLon);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location for this site, or type coordinates."
            : "Could not read device location. Type coordinates, or try Use My Location again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function submitForm() {
    const nextLat = Number(lat);
    const nextLon = Number(lon);
    void runLookup(nextLat, nextLon);
  }

  return (
    <div>
      <form
        ref={form}
        className="sight-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <label>
          Latitude
          <input
            type="number"
            name="lat"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            step="0.0001"
            min={-90}
            max={90}
            required
            placeholder="51.5074…"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            name="lon"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            step="0.0001"
            min={-180}
            max={180}
            required
            placeholder="-0.1278…"
            value={lon}
            onChange={(event) => setLon(event.target.value)}
          />
        </label>
        <div className="sight-actions">
          <button
            type="button"
            disabled={locating}
            {...pressProps(() => {
              if (!locating) useDeviceLocation();
            })}
          >
            {locating ? "Locating…" : "Use My Location"}
          </button>
          <button
            type="submit"
            disabled={loading}
            {...pressProps((event) => {
              event.preventDefault();
              if (!loading) form.current?.requestSubmit();
            })}
          >
            {loading ? "Computing…" : "Find Trains"}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {geoError ? (
          <p className="note" ref={errorRef} tabIndex={-1}>
            {geoError}
          </p>
        ) : null}
        {error ? (
          <p className="note" ref={errorRef} tabIndex={-1}>
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <>
          <p className="sub">
            Next {result.horizonHours} hours at {result.lat}°, {result.lon}°.{" "}
            {result.satelliteCount} Starlink objects from {result.launches}{" "}
            recent launches.
          </p>
          <p className="note">{result.note}</p>
          {result.trains.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Appears</th>
                    <th>Highest</th>
                    <th>Duration</th>
                    <th>Max El.</th>
                    <th>Sats</th>
                    <th>Launch</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trains.map((train) => (
                    <tr key={`${train.launchId}-${train.startUtc}`}>
                      <td data-label="Appears">
                        <div className="cell-body">
                          {formatLocalWhen(train.startUtc)}
                        </div>
                        <div className="note">{train.appears}</div>
                      </td>
                      <td data-label="Highest">
                        <div className="cell-body">
                          {formatLocalWhen(train.peakUtc)}
                        </div>
                        <div className="note">{train.highest}</div>
                      </td>
                      <td data-label="Duration">
                        <div className="cell-body">
                          {train.durationMin}
                          {"\u00a0"}min
                        </div>
                        <div className="note">
                          gone {formatLocalWhen(train.endUtc)}
                        </div>
                      </td>
                      <td data-label="Max El.">
                        <div className="cell-body">{train.maxElevationDeg}°</div>
                        <div className="note">
                          {train.rangeKm}
                          {"\u00a0"}km
                        </div>
                      </td>
                      <td data-label="Sats">
                        <div className="cell-body">{train.satellites}</div>
                        <div className="note">
                          {train.firstName} → {train.lastName}
                        </div>
                      </td>
                      <td data-label="Launch">
                        <div className="cell-body">{train.launchName}</div>
                        {train.launchDate ? (
                          <div className="note">{train.launchDate}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="note">
              No trains in the next {result.horizonHours} hours from this
              location. Try another point, or wait for a new launch.
            </p>
          )}
          <p className="source">
            Source:{" "}
            <a href={result.sourceUrl} rel="noreferrer">
              {result.sourceLabel}
            </a>
            . GP fetched {formatUtcStamp(result.fetchedUtc)}. Times shown in
            your local timezone.
          </p>
        </>
      ) : null}
    </div>
  );
}
