"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GroundTrackMap, paintLive } from "@/components/GroundTrackMap";
import { formatUtcStamp } from "@/lib/format";
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
import { patchQuery } from "@/lib/query";

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

function shellsParam(shells: Record<ShellId, boolean>) {
  if (SHELLS.every((shell) => shells[shell])) return null;
  return SHELLS.filter((shell) => shells[shell]).join(",") || "none";
}

export function GroundTrackPanel({
  data,
  initialShells,
  initialSat,
}: {
  data: GroundTrackSet;
  initialShells: Record<ShellId, boolean>;
  initialSat: number | null;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Record<number, LiveFix>>({});
  const [shells, setShells] = useState(initialShells);
  const [selectedId, setSelectedId] = useState<number | null>(initialSat);
  const [paused, setPaused] = useState(false);
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

  useEffect(() => {
    document.documentElement.classList.toggle("motion-paused", paused);
    return () => document.documentElement.classList.remove("motion-paused");
  }, [paused]);

  function persist(nextShells: Record<ShellId, boolean>, sat: number | null) {
    patchQuery({
      shells: shellsParam(nextShells),
      sat: sat == null ? null : String(sat),
    });
  }

  function toggleShell(shell: ShellId) {
    const next = { ...shells, [shell]: !shells[shell] };
    setShells(next);
    persist(next, selectedId);
  }

  function selectSat(id: number | null) {
    setSelectedId(id);
    persist(shells, id);
  }

  return (
    <div className="track-panel" ref={panel}>
      <div className="track-toolbar">
        <div className="track-legend" role="group" aria-label="Inclination Shells">
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
              <span className="track-swatch" data-shell={shell} aria-hidden="true" />
              {SHELL_LABEL[shell]} shell
            </button>
          ))}
        </div>
        <p className="track-clock">
          <span className="track-live-dot" aria-hidden="true" />
          <span data-live-clock aria-live="off">
            Live Positions Starting…
          </span>
        </p>
        <button
          type="button"
          className="track-legend-btn"
          aria-pressed={paused}
          {...pressProps(() => setPaused((value) => !value))}
        >
          {paused ? "Play Motion" : "Pause Motion"}
        </button>
        {activeId != null ? (
          <button
            type="button"
            className="track-legend-btn"
            {...pressProps(() => selectSat(null))}
          >
            Clear Selection
          </button>
        ) : null}
      </div>

      {visibleTracks.length > 0 ? (
        <GroundTrackMap
          tracks={visibleTracks}
          trails={trails}
          futures={futures}
          selectedId={activeId}
          onSelect={selectSat}
        />
      ) : (
        <p>Turn a shell back on to see tracks.</p>
      )}

      {visibleTracks.length > 0 ? (
        <div className="table-wrap">
          <table className="track-table">
            <thead>
              <tr>
                <th>Satellite</th>
                <th>Position Now</th>
                <th>Altitude</th>
                <th>Inclination</th>
                <th>NORAD</th>
                <th>GP Epoch (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {visibleTracks.map((track) => {
                const selected = activeId === track.catalogId;
                return (
                  <tr
                    key={track.catalogId}
                    className={selected ? "is-selected" : undefined}
                    aria-selected={selected}
                  >
                    <td data-label="Satellite">
                      <div className="cell-body">
                        <button
                          type="button"
                          className="track-select"
                          aria-pressed={selected}
                          {...pressProps(() =>
                            selectSat(selected ? null : track.catalogId),
                          )}
                        >
                          <span className="track-name">
                            <span
                              className="track-swatch"
                              data-shell={track.shell}
                              aria-hidden="true"
                            />
                            {track.name}
                          </span>
                        </button>
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
                        {formatUtcStamp(track.epoch)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
