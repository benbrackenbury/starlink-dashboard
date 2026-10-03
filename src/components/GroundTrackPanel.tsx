"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { GroundTrackMap, paintLive } from "@/components/GroundTrackMap";
import {
  headingDeg,
  positionFromSatrec,
  samplePositions,
  satrecFromOmm,
  segmentsFromLonLat,
  SHELLS,
  type GroundTrackSet,
  type LiveFix,
  type ShellId,
  type TrackSegment,
} from "@/lib/groundTracks";
import { pressProps } from "@/lib/press";

const SHELL_LABEL: Record<ShellId, string> = {
  "43": "43°",
  "53": "53°",
  "70": "70°",
  "97": "97°",
};

const LIVE_MS = 100;
const TRAIL_MS = 15 * 60 * 1000;
const TRAIL_STEPS = 18;
const FUTURE_MS = 8 * 60 * 1000;
const FUTURE_STEPS = 10;
const HEADING_AHEAD_MS = 20_000;

export function GroundTrackPanel({ data }: { data: GroundTrackSet }) {
  const panel = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Record<number, LiveFix>>({});
  const [shells, setShells] = useState<Record<ShellId, boolean>>({
    "43": true,
    "53": true,
    "70": true,
    "97": true,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trails, setTrails] = useState<Record<number, TrackSegment[]>>({});
  const [futures, setFutures] = useState<Record<number, TrackSegment[]>>({});

  const satrecs = useMemo(
    () =>
      data.tracks.map((track) => ({
        catalogId: track.catalogId,
        satrec: satrecFromOmm(track.omm),
      })),
    [data.tracks],
  );

  const visibleTracks = useMemo(
    () => data.tracks.filter((track) => shells[track.shell]),
    [data.tracks, shells],
  );
  const selectedStillVisible = visibleTracks.some(
    (track) => track.catalogId === selectedId,
  );
  const activeId = selectedStillVisible ? selectedId : null;

  useLayoutEffect(() => {
    let frame = 0;
    let timer = 0;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const date = new Date();
      const nextLive: Record<number, LiveFix> = {};
      const refreshPath = frame % 10 === 1;
      const nextTrails: Record<number, TrackSegment[]> = {};
      const nextFutures: Record<number, TrackSegment[]> = {};

      for (const item of satrecs) {
        const here = positionFromSatrec(item.satrec, date);
        if (!here) continue;
        const ahead = positionFromSatrec(
          item.satrec,
          new Date(date.getTime() + HEADING_AHEAD_MS),
        );
        nextLive[item.catalogId] = {
          ...here,
          headingDeg: ahead ? headingDeg(here, ahead) : 0,
        };
        if (refreshPath) {
          const behind = samplePositions(
            item.satrec,
            new Date(date.getTime() - TRAIL_MS),
            TRAIL_MS,
            TRAIL_STEPS,
          );
          const forward = samplePositions(item.satrec, date, FUTURE_MS, FUTURE_STEPS);
          nextTrails[item.catalogId] = segmentsFromLonLat(behind);
          nextFutures[item.catalogId] = segmentsFromLonLat(forward);
        }
      }

      liveRef.current = nextLive;
      if (panel.current) paintLive(panel.current, nextLive);
      if (refreshPath) {
        setTrails(nextTrails);
        setFutures(nextFutures);
      }
      frame += 1;
      timer = window.setTimeout(tick, LIVE_MS);
    }

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [satrecs]);

  useLayoutEffect(() => {
    if (panel.current) paintLive(panel.current, liveRef.current);
  }, [trails, futures, visibleTracks, activeId]);

  function toggleShell(shell: ShellId) {
    setShells((current) => ({ ...current, [shell]: !current[shell] }));
  }

  return (
    <div className="track-panel" ref={panel}>
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
              {...pressProps(() => toggleShell(shell))}
            >
              <span className="track-swatch" data-shell={shell} />
              {SHELL_LABEL[shell]} shell
            </button>
          ))}
        </div>
        <p className="track-clock">
          <span className="track-live-dot" aria-hidden="true" />
          <span data-live-clock>Live positions starting…</span>
        </p>
      </div>

      {visibleTracks.length > 0 ? (
        <GroundTrackMap
          tracks={visibleTracks}
          trails={trails}
          futures={futures}
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
              const selected = activeId === track.catalogId;
              return (
                <tr
                  key={track.catalogId}
                  className={selected ? "is-selected" : undefined}
                  tabIndex={0}
                  aria-selected={selected}
                  {...pressProps(() =>
                    setSelectedId(selected ? null : track.catalogId),
                  )}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(selected ? null : track.catalogId);
                    }
                  }}
                >
                  <td data-label="Satellite">
                    <div className="cell-body">
                      <span className="track-name">
                        <span className="track-swatch" data-shell={track.shell} />
                        {track.name}
                      </span>
                    </div>
                  </td>
                  <td data-label="Position">
                    <div className="cell-body" data-pos={track.catalogId}>
                      …
                    </div>
                  </td>
                  <td data-label="Altitude">
                    <div className="cell-body" data-alt={track.catalogId}>
                      …
                    </div>
                  </td>
                  <td data-label="Incl.">
                    <div className="cell-body">
                      {track.inclinationDeg.toFixed(2)}°
                    </div>
                  </td>
                  <td data-label="NORAD">
                    <div className="cell-body">{track.catalogId}</div>
                  </td>
                  <td data-label="Epoch" className="num">
                    <div className="cell-body">
                      {track.epoch.replace("T", " ").replace(/\.\d+$/, "")}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
