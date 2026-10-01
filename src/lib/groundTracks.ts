import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type OMMJsonObject,
} from "satellite.js";
import sample from "@/data/celestrak-starlink-sample.json";

export type TrackSegment = { points: string };

export type GroundTrack = {
  name: string;
  catalogId: number;
  inclinationDeg: number;
  epoch: string;
  segments: TrackSegment[];
};

export type GroundTrackSet = {
  fetchedLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  subsetNote: string;
  tracks: GroundTrack[];
};

const STEPS = 72;

function lonToX(lon: number) {
  return lon + 180;
}

function latToY(lat: number) {
  return 90 - lat;
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
    const pv = propagate(satrec, date);
    if (!pv?.position) return null;
    const geo = eciToGeodetic(pv.position, gstime(date));
    points.push({
      lon: degreesLong(geo.longitude),
      lat: degreesLat(geo.latitude),
    });
  }

  const segments: TrackSegment[] = [];
  let current: string[] = [];
  let prevLon: number | null = null;

  for (const point of points) {
    if (prevLon !== null && Math.abs(point.lon - prevLon) > 180) {
      if (current.length > 1) segments.push({ points: current.join(" ") });
      current = [];
    }
    current.push(`${lonToX(point.lon).toFixed(2)},${latToY(point.lat).toFixed(2)}`);
    prevLon = point.lon;
  }
  if (current.length > 1) segments.push({ points: current.join(" ") });

  return {
    name: omm.OBJECT_NAME,
    catalogId: Number(omm.NORAD_CAT_ID),
    inclinationDeg: Number(omm.INCLINATION),
    epoch: omm.EPOCH,
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
