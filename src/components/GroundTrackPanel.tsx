"use client";

import { useEffect, useMemo, useState } from "react";
import { GroundTrackMap } from "@/components/GroundTrackMap";
import {
  formatLat,
  formatLon,
  positionFromSatrec,
  satrecFromOmm,
  SHELLS,
  type GeoPosition,
  type GroundTrackSet,
  type ShellId,
} from "@/lib/groundTracks";

const SHELL_LABEL: Record<ShellId, string> = {
  "43": "43°",
  "53": "53°",
  "70": "70°",
  "97": "97°",
};

function formatClock(date: Date) {
  return date.toISOString().replace("T", " ").replace("Z", " UTC");
}

export function GroundTrackPanel({ data }: { data: GroundTrackSet }) {
  const [shells, setShells] = useState<Record<ShellId, boolean>>({
    "43": true,
    "53": true,
    "70": true,
    "97": true,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [positions, setPositions] = useState<Record<number, GeoPosition>>({});

  const satrecs = useMemo(
    () =>
      data.tracks.map((track) => ({
        catalogId: track.catalogId,
        satrec: satrecFromOmm(track.omm),
      })),
    [data.tracks],
  );

  useEffect(() => {
    function tick() {
      const date = new Date();
      const next: Record<number, GeoPosition> = {};
      for (const item of satrecs) {
        const pos = positionFromSatrec(item.satrec, date);
        if (pos) next[item.catalogId] = pos;
      }
      setNow(date);
      setPositions(next);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [satrecs]);

  const visibleTracks = data.tracks.filter((track) => shells[track.shell]);
  const selectedStillVisible = visibleTracks.some(
    (track) => track.catalogId === selectedId,
  );
  const activeId = selectedStillVisible ? selectedId : null;

  function toggleShell(shell: ShellId) {
    setShells((current) => ({ ...current, [shell]: !current[shell] }));
  }

  return (
    <div className="track-panel">
      <div className="track-toolbar">
        <div className="track-legend" role="group" aria-label="Inclination shells">
          {SHELLS.map((shell) => (
            <button
              key={shell}
              type="button"
              className={
                shells[shell]
                  ? "track-legend-btn is-on"
                  : "track-legend-btn is-off"
              }
              data-shell={shell}
              aria-pressed={shells[shell]}
              onClick={() => toggleShell(shell)}
            >
              <span className="track-swatch" data-shell={shell} />
              {SHELL_LABEL[shell]} shell
            </button>
          ))}
        </div>
        <p className="track-clock">
          {now
            ? `Positions now · ${formatClock(now)}`
            : "Positions update after load"}
        </p>
      </div>

      {visibleTracks.length > 0 ? (
        <GroundTrackMap
          tracks={visibleTracks}
          positions={positions}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
      ) : (
        <p>Turn a shell back on to see tracks.</p>
      )}

      <div className="table-wrap">
        <table className="track-table">
          <thead>
            <tr>
              <th>Satellite</th>
              <th>Position now</th>
              <th>Altitude</th>
              <th>Inclination</th>
              <th>NORAD</th>
              <th>GP epoch (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {visibleTracks.map((track) => {
              const pos = positions[track.catalogId];
              const selected = activeId === track.catalogId;
              return (
                <tr
                  key={track.catalogId}
                  className={selected ? "is-selected" : undefined}
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() =>
                    setSelectedId(selected ? null : track.catalogId)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(selected ? null : track.catalogId);
                    }
                  }}
                >
                  <td data-label="Satellite">
                    <span className="track-name">
                      <span className="track-swatch" data-shell={track.shell} />
                      {track.name}
                    </span>
                  </td>
                  <td data-label="Position now">
                    {pos
                      ? `${formatLat(pos.lat)} ${formatLon(pos.lon)}`
                      : "…"}
                  </td>
                  <td data-label="Altitude">
                    {pos ? `${Math.round(pos.altKm).toLocaleString("en-GB")} km` : "…"}
                  </td>
                  <td data-label="Inclination">
                    {track.inclinationDeg.toFixed(2)}°
                  </td>
                  <td data-label="NORAD">{track.catalogId}</td>
                  <td data-label="GP epoch">{track.epoch.replace("T", " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
