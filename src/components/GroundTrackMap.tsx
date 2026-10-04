"use client";

import { memo } from "react";
import { WORLD_LAND_PATH } from "@/data/worldLandPath";
import {
  formatLat,
  formatLon,
  latToY,
  lonToX,
  type GroundTrack,
  type LiveFix,
  type ShellId,
  type TrackSegment,
} from "@/lib/groundTracks";
import { formatCount, formatUtcStamp } from "@/lib/format";
import { pressProps } from "@/lib/press";

const MERIDIANS = [-180, -120, -60, 0, 60, 120, 180];
const PARALLELS = [-60, -30, 0, 30, 60];

const Backdrop = memo(function Backdrop() {
  return (
    <>
      <rect className="track-map-sea" x="0" y="0" width="360" height="180" />
      <path className="track-map-land" d={WORLD_LAND_PATH} />
      {MERIDIANS.map((lon) => (
        <line
          key={`m${lon}`}
          className="track-map-grid"
          x1={lon + 180}
          y1="0"
          x2={lon + 180}
          y2="180"
        />
      ))}
      {PARALLELS.map((lat) => (
        <line
          key={`p${lat}`}
          className="track-map-grid"
          x1="0"
          y1={90 - lat}
          x2="360"
          y2={90 - lat}
        />
      ))}
    </>
  );
});

function PathSet({
  tracks,
  segmentsFor,
  className,
  selectedId,
  onSelect,
  strokeWidth,
}: {
  tracks: GroundTrack[];
  segmentsFor: (track: GroundTrack) => TrackSegment[];
  className: string;
  selectedId: number | null;
  onSelect: (catalogId: number) => void;
  strokeWidth: (active: boolean) => number;
}) {
  return tracks.map((track) => {
    const active = selectedId === track.catalogId;
    const dimmed = selectedId != null && !active;
    const select = pressProps<SVGPolylineElement>((event) => {
      event.stopPropagation();
      onSelect(track.catalogId);
    });
    return segmentsFor(track).map((segment, index) => (
      <polyline
        key={`${className}-${track.catalogId}-${index}`}
        className={`${className}${dimmed ? " is-dim" : " is-on"}${active ? " is-active" : ""}`}
        data-shell={track.shell as ShellId}
        fill="none"
        points={segment.points}
        strokeWidth={strokeWidth(active)}
        {...select}
      />
    ));
  });
}

export function paintLive(root: HTMLElement, live: Record<number, LiveFix>) {
  const clock = root.querySelector("[data-live-clock]");
  if (clock) {
    const date = new Date();
    clock.textContent = `Live · ${formatUtcStamp(date.toISOString())}`;
  }

  root.querySelectorAll<SVGGElement>("[data-sat]").forEach((node) => {
    const pos = live[Number(node.dataset.sat)];
    if (!pos) return;
    node.setAttribute(
      "transform",
      `translate(${lonToX(pos.lon)} ${latToY(pos.lat)}) rotate(${pos.headingDeg})`,
    );
  });

  root.querySelectorAll<HTMLElement>("[data-pos]").forEach((node) => {
    const pos = live[Number(node.dataset.pos)];
    node.textContent = pos ? `${formatLat(pos.lat)} ${formatLon(pos.lon)}` : "…";
  });

  root.querySelectorAll<HTMLElement>("[data-alt]").forEach((node) => {
    const pos = live[Number(node.dataset.alt)];
    node.textContent = pos
      ? `${formatCount(Math.round(pos.altKm))}\u00a0km`
      : "…";
  });

  const label = root.querySelector<SVGTextElement>("[data-sat-label]");
  if (!label) return;
  const pos = live[Number(label.dataset.satLabel)];
  if (!pos) return;
  label.setAttribute(
    "x",
    String(Math.min(328, Math.max(8, lonToX(pos.lon) + 5))),
  );
  label.setAttribute(
    "y",
    String(Math.min(174, Math.max(8, latToY(pos.lat) - 4))),
  );
}

export const GroundTrackMap = memo(function GroundTrackMap({
  tracks,
  trails,
  futures,
  selectedId,
  onSelect,
}: {
  tracks: GroundTrack[];
  trails: Record<number, TrackSegment[]>;
  futures: Record<number, TrackSegment[]>;
  selectedId: number | null;
  onSelect: (catalogId: number | null) => void;
}) {
  const selected = tracks.find((track) => track.catalogId === selectedId);
  const clear = pressProps<SVGSVGElement>(() => onSelect(null));

  return (
    <figure className="track-map">
      <svg
        viewBox="0 0 360 180"
        role="img"
        aria-label="Live equirectangular world map of Starlink ground tracks with current SGP4 motion"
        {...clear}
      >
        <Backdrop />
        <PathSet
          tracks={tracks}
          segmentsFor={(track) => track.segments}
          className="track-map-path"
          selectedId={selectedId}
          onSelect={(id) => onSelect(id)}
          strokeWidth={(active) => (active ? 1.15 : 0.65)}
        />
        <PathSet
          tracks={tracks}
          segmentsFor={(track) => trails[track.catalogId] ?? []}
          className="track-map-trail"
          selectedId={selectedId}
          onSelect={(id) => onSelect(id)}
          strokeWidth={(active) => (active ? 1.9 : 1.25)}
        />
        <PathSet
          tracks={tracks}
          segmentsFor={(track) => futures[track.catalogId] ?? []}
          className="track-map-future"
          selectedId={selectedId}
          onSelect={(id) => onSelect(id)}
          strokeWidth={(active) => (active ? 1.4 : 0.95)}
        />
        {tracks.map((track) => {
          const active = selectedId === track.catalogId;
          const dimmed = selectedId != null && !active;
          const pick = pressProps<SVGGElement>((event) => {
            event.stopPropagation();
            onSelect(track.catalogId);
          });
          return (
            <g
              key={`sat-${track.catalogId}`}
              className={
                dimmed ? "track-map-craft is-dim" : "track-map-craft is-on"
              }
              data-sat={track.catalogId}
              data-shell={track.shell}
              transform="translate(-20 -20)"
              aria-label={`${track.name} · ${track.inclinationDeg.toFixed(0)}° shell`}
              {...pick}
            >
              <circle className="track-map-pulse" r="4.5" />
              <polygon
                className="track-map-nose"
                points="3.6,0 -2.1,-1.55 -2.1,1.55"
              />
              <circle
                className="track-map-sat"
                r={active ? 1.35 : 1.05}
                cx="0"
                cy="0"
              />
            </g>
          );
        })}
        {selected ? (
          <text
            className="track-map-label"
            data-sat-label={selected.catalogId}
            x="8"
            y="8"
          >
            {selected.name}
          </text>
        ) : null}
      </svg>
      <figcaption>
        Live SGP4 motion from the published GP set, not GPS. Solid recent trail
        is the last 15{"\u00a0"}minutes; dashed is the next 8{"\u00a0"}minutes.
        Colours are inclination shells. Land from Natural Earth 110m (public
        domain). Click a track, or use Select in the table. Pause Motion stops
        the looping trail animation.
      </figcaption>
    </figure>
  );
});
