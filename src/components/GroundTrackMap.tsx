"use client";

import { WORLD_LAND_PATH } from "@/data/worldLandPath";
import {
  latToY,
  lonToX,
  type GeoPosition,
  type GroundTrack,
  type ShellId,
} from "@/lib/groundTracks";

const MERIDIANS = [-180, -120, -60, 0, 60, 120, 180];
const PARALLELS = [-60, -30, 0, 30, 60];

export function GroundTrackMap({
  tracks,
  positions,
  selectedId,
  onSelect,
}: {
  tracks: GroundTrack[];
  positions: Record<number, GeoPosition>;
  selectedId: number | null;
  onSelect: (catalogId: number | null) => void;
}) {
  const selected = tracks.find((track) => track.catalogId === selectedId);
  const selectedPos = selectedId != null ? positions[selectedId] : undefined;

  return (
    <figure className="track-map">
      <svg
        viewBox="0 0 360 180"
        role="img"
        aria-label="Equirectangular world map with colour-coded Starlink ground tracks and current SGP4 positions"
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
        {tracks.map((track) => {
          const active = selectedId === track.catalogId;
          const dimmed = selectedId != null && !active;
          return track.segments.map((segment, index) => (
            <polyline
              key={`${track.catalogId}-${index}`}
              className={
                dimmed ? "track-map-path is-dim" : "track-map-path is-on"
              }
              data-shell={track.shell as ShellId}
              fill="none"
              points={segment.points}
              strokeWidth={active ? 1.6 : 0.85}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(track.catalogId);
              }}
            />
          ));
        })}
        {tracks.map((track) => {
          const pos = positions[track.catalogId];
          if (!pos) return null;
          const active = selectedId === track.catalogId;
          const dimmed = selectedId != null && !active;
          return (
            <circle
              key={`sat-${track.catalogId}`}
              className={
                dimmed ? "track-map-sat is-dim" : "track-map-sat is-on"
              }
              data-shell={track.shell}
              cx={lonToX(pos.lon)}
              cy={latToY(pos.lat)}
              r={active ? 2.4 : 1.7}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(track.catalogId);
              }}
            >
              <title>
                {track.name} · {track.inclinationDeg.toFixed(0)}° shell
              </title>
            </circle>
          );
        })}
        {selected && selectedPos ? (
          <text
            className="track-map-label"
            x={Math.min(330, Math.max(8, lonToX(selectedPos.lon) + 4))}
            y={Math.min(174, Math.max(8, latToY(selectedPos.lat) - 3))}
          >
            {selected.name}
          </text>
        ) : null}
      </svg>
      <figcaption>
        Equirectangular world map. Colours are inclination shells; dots are
        SGP4 positions at the clock time from the published GP set, not GPS.
        Land from Natural Earth 110m (public domain). Click a track, dot, or
        table row to isolate one satellite.
      </figcaption>
    </figure>
  );
}
