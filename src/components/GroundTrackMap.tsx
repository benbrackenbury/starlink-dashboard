"use client";

import { WORLD_LAND_PATH } from "@/data/worldLandPath";
import {
  latToY,
  lonToX,
  type GroundTrack,
  type LiveFix,
  type ShellId,
  type TrackSegment,
} from "@/lib/groundTracks";

const MERIDIANS = [-180, -120, -60, 0, 60, 120, 180];
const PARALLELS = [-60, -30, 0, 30, 60];

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
    return segmentsFor(track).map((segment, index) => (
      <polyline
        key={`${className}-${track.catalogId}-${index}`}
        className={`${className}${dimmed ? " is-dim" : " is-on"}${active ? " is-active" : ""}`}
        data-shell={track.shell as ShellId}
        fill="none"
        points={segment.points}
        strokeWidth={strokeWidth(active)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(track.catalogId);
        }}
      />
    ));
  });
}

export function GroundTrackMap({
  tracks,
  live,
  trails,
  futures,
  selectedId,
  onSelect,
}: {
  tracks: GroundTrack[];
  live: Record<number, LiveFix>;
  trails: Record<number, TrackSegment[]>;
  futures: Record<number, TrackSegment[]>;
  selectedId: number | null;
  onSelect: (catalogId: number | null) => void;
}) {
  const selected = tracks.find((track) => track.catalogId === selectedId);
  const selectedPos = selectedId != null ? live[selectedId] : undefined;

  return (
    <figure className="track-map">
      <svg
        viewBox="0 0 360 180"
        role="img"
        aria-label="Live equirectangular world map of Starlink ground tracks with current SGP4 motion"
        onClick={() => onSelect(null)}
      >
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
          const pos = live[track.catalogId];
          if (!pos) return null;
          const active = selectedId === track.catalogId;
          const dimmed = selectedId != null && !active;
          const x = lonToX(pos.lon);
          const y = latToY(pos.lat);
          return (
            <g
              key={`sat-${track.catalogId}`}
              className={
                dimmed ? "track-map-craft is-dim" : "track-map-craft is-on"
              }
              data-shell={track.shell}
              transform={`translate(${x} ${y}) rotate(${pos.headingDeg})`}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(track.catalogId);
              }}
            >
              <title>
                {track.name} · {track.inclinationDeg.toFixed(0)}° shell
              </title>
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
        {selected && selectedPos ? (
          <text
            className="track-map-label"
            x={Math.min(328, Math.max(8, lonToX(selectedPos.lon) + 5))}
            y={Math.min(174, Math.max(8, latToY(selectedPos.lat) - 4))}
          >
            {selected.name}
          </text>
        ) : null}
      </svg>
      <figcaption>
        Live SGP4 motion from the published GP set, not GPS. Solid recent trail
        is the last 15 minutes; dashed is the next 8. Colours are inclination
        shells. Land from Natural Earth 110m (public domain). Click a track or
        row to isolate one satellite.
      </figcaption>
    </figure>
  );
}
