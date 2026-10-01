import { WORLD_LAND_PATH } from "@/data/worldLandPath";
import type { GroundTrackSet } from "@/lib/groundTracks";

export function GroundTrackMap({ data }: { data: GroundTrackSet }) {
  const meridians = [-180, -120, -60, 0, 60, 120, 180];
  const parallels = [-60, -30, 0, 30, 60];

  return (
    <figure className="track-map">
      <svg
        viewBox="0 0 360 180"
        role="img"
        aria-label="Equirectangular world map with ground tracks for a 12-satellite Starlink subset"
      >
        <rect className="track-map-sea" x="0" y="0" width="360" height="180" />
        <path className="track-map-land" d={WORLD_LAND_PATH} />
        {meridians.map((lon) => (
          <line
            key={`m${lon}`}
            className="track-map-grid"
            x1={lon + 180}
            y1="0"
            x2={lon + 180}
            y2="180"
          />
        ))}
        {parallels.map((lat) => (
          <line
            key={`p${lat}`}
            className="track-map-grid"
            x1="0"
            y1={90 - lat}
            x2="360"
            y2={90 - lat}
          />
        ))}
        {data.tracks.map((track) =>
          track.segments.map((segment, index) => (
            <polyline
              key={`${track.catalogId}-${index}`}
              className="track-map-path"
              fill="none"
              points={segment.points}
            />
          )),
        )}
      </svg>
      <figcaption>
        Equirectangular world map with one-orbit ground tracks. Longitude −180°
        to 180°, latitude −90° to 90°. Land from Natural Earth 110m (public
        domain).
      </figcaption>
    </figure>
  );
}
