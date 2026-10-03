"use client";

import { useEffect, useState } from "react";
import type { SightingResult } from "@/lib/sightings";

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

export function TrainSightingsPanel() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<SightingResult | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { lat?: number; lon?: number };
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        setLat(String(parsed.lat));
        setLon(String(parsed.lon));
      }
    } catch {
      /* ignore bad localStorage */
    }
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
        saveCoords(
          Number(pos.coords.latitude.toFixed(4)),
          Number(pos.coords.longitude.toFixed(4)),
        );
        setLocating(false);
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

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    const nextLat = Number(lat);
    const nextLon = Number(lon);
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
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="sight-form" onSubmit={lookup}>
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
          <button type="button" onClick={useDeviceLocation} disabled={locating}>
            {locating ? "Locating…" : "Use my location"}
          </button>
          <button type="submit" disabled={loading}>
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
                        <div className="cell-body">{train.launchId}</div>
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
