import type { OMMJsonObject } from "satellite.js";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type SatRec,
} from "@/lib/sgp4";
import sample from "@/data/celestrak-starlink-sample.json";

export type TrackSegment = { points: string };

export const SHELLS = ["43", "53", "70", "97"] as const;
export type ShellId = (typeof SHELLS)[number];

export type GroundTrack = {
  name: string;
  catalogId: number;
  inclinationDeg: number;
  epoch: string;
  shell: ShellId;
  periodMin: number;
  omm: OMMJsonObject;
  segments: TrackSegment[];
};

export type GroundTrackSet = {
  fetchedLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  subsetNote: string;
  tracks: GroundTrack[];
};

export type GeoPosition = {
  lon: number;
  lat: number;
  altKm: number;
};

const STEPS = 72;
const SHELL_TARGETS: ShellId[] = ["43", "53", "70", "97"];

export function lonToX(lon: number) {
  return lon + 180;
}

export function latToY(lat: number) {
  return 90 - lat;
}

export function shellForInclination(inclinationDeg: number): ShellId {
  return SHELL_TARGETS.reduce((best, shell) =>
    Math.abs(Number(shell) - inclinationDeg) <
    Math.abs(Number(best) - inclinationDeg)
      ? shell
      : best,
  );
}

export function formatLat(lat: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
}

export function formatLon(lon: number) {
  return `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
}

export function satrecFromOmm(omm: OMMJsonObject): SatRec {
  return json2satrec(omm);
}

export function positionFromSatrec(
  satrec: SatRec,
  date: Date,
): GeoPosition | null {
  const pv = propagate(satrec, date);
  if (!pv?.position) return null;
  const geo = eciToGeodetic(pv.position, gstime(date));
  return {
    lon: degreesLong(geo.longitude),
    lat: degreesLat(geo.latitude),
    altKm: geo.height,
  };
}

function epochDate(epoch: string) {
  return new Date(epoch.endsWith("Z") ? epoch : `${epoch}Z`);
}

function trackForOmm(omm: OMMJsonObject): GroundTrack | null {
  const satrec = json2satrec(omm);
  const start = epochDate(omm.EPOCH);
  const meanMotion = Number(omm.MEAN_MOTION);
  const periodMs = (1440 / meanMotion) * 60 * 1000;
  const points: { lon: number; lat: number }[] = [];

  for (let i = 0; i <= STEPS; i += 1) {
    const date = new Date(start.getTime() + (periodMs * i) / STEPS);
    const geo = positionFromSatrec(satrec, date);
    if (!geo) return null;
    points.push({ lon: geo.lon, lat: geo.lat });
  }

  const segments: TrackSegment[] = [];
  let current: string[] = [];
  let prevLon: number | null = null;

  for (const point of points) {
    if (prevLon !== null && Math.abs(point.lon - prevLon) > 180) {
      if (current.length > 1) segments.push({ points: current.join(" ") });
      current = [];
    }
    current.push(
      `${lonToX(point.lon).toFixed(2)},${latToY(point.lat).toFixed(2)}`,
    );
    prevLon = point.lon;
  }
  if (current.length > 1) segments.push({ points: current.join(" ") });

  return {
    name: omm.OBJECT_NAME,
    catalogId: Number(omm.NORAD_CAT_ID),
    inclinationDeg: Number(omm.INCLINATION),
    epoch: omm.EPOCH,
    shell: shellForInclination(Number(omm.INCLINATION)),
    periodMin: 1440 / meanMotion,
    omm,
    segments,
  };
}

export function getGroundTracks(): GroundTrackSet {
  const tracks = (sample.objects as OMMJsonObject[])
    .map(trackForOmm)
    .filter((track): track is GroundTrack => track !== null);

  return {
    fetchedLabel: sample.fetchedLabel,
    sourceLabel: sample.sourceLabel,
    sourceUrl: sample.sourceUrl,
    subsetNote: sample.subsetNote,
    tracks,
  };
}
