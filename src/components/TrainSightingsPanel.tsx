"use client";

import { useEffect, useRef, useState } from "react";
import type { SightingResult } from "@/lib/sightings";
import { pressProps } from "@/lib/press";

const STORAGE_KEY = "starlink-train-location";

function formatWhen(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export function TrainSightingsPanel() {
  const form = useRef<HTMLFormElement>(null);
  const inflight = useRef(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<SightingResult | null>(null);

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
        setError(body.error ?? "Lookup failed.");
        return;
      }
      saveCoords(nextLat, nextLon);
      setResult(body);
    } catch {
      setResult(null);
      setError("Lookup failed.");
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = readStoredCoords();
    if (stored) {
      setLat(String(stored.lat));
      setLon(String(stored.lon));
    }

    const node = form.current;
    if (!node || !stored) return;
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
  }, []);

  function saveCoords(nextLat: number, nextLon: number) {
    setLat(String(nextLat));
    setLon(String(nextLon));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lat: nextLat, lon: nextLon }),
    );
  }

  function useDeviceLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("This browser will not share a device location.");
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
            ? "Location permission denied."
            : "Could not read device location.",
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
            step="0.0001"
            min={-90}
            max={90}
            required
            value={lat}
            onChange={(event) => setLat(event.target.value)}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            name="lon"
            step="0.0001"
            min={-180}
            max={180}
            required
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
            {locating ? "Locating…" : "Use my location"}
          </button>
          <button
            type="submit"
            disabled={loading}
            {...pressProps((event) => {
              event.preventDefault();
              if (!loading) form.current?.requestSubmit();
            })}
          >
            {loading ? "Computing…" : "Find trains"}
          </button>
        </div>
      </form>
      {geoError ? <p className="note">{geoError}</p> : null}
      {error ? <p className="note">{error}</p> : null}

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
                    <th>Max el.</th>
                    <th>Sats</th>
                    <th>Launch</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trains.map((train) => (
                    <tr key={`${train.launchId}-${train.startUtc}`}>
                      <td data-label="Appears">
                        <div className="cell-body">
                          {formatWhen(train.startUtc)}
                        </div>
                        <div className="note">{train.appears}</div>
                      </td>
                      <td data-label="Highest">
                        <div className="cell-body">
                          {formatWhen(train.peakUtc)}
                        </div>
                        <div className="note">{train.highest}</div>
                      </td>
                      <td data-label="Duration">
                        <div className="cell-body">{train.durationMin} min</div>
                        <div className="note">
                          gone {formatWhen(train.endUtc)}
                        </div>
                      </td>
                      <td data-label="Max el.">
                        <div className="cell-body">{train.maxElevationDeg}°</div>
                        <div className="note">{train.rangeKm} km</div>
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
          ) : null}
          <p className="source">
            Source:{" "}
            <a href={result.sourceUrl} rel="noreferrer">
              {result.sourceLabel}
            </a>
            . GP fetched {result.fetchedUtc.replace("T", " ").replace(/\.\d+Z$/, " UTC")}.
            Times shown in your local timezone.
          </p>
        </>
      ) : null}
    </div>
  );
}
