import type { GeodeticLocation, OMMJsonObject } from "satellite.js";
import {
  degreesToRadians,
  eciToEcf,
  ecfToLookAngles,
  gstime,
  jday,
  json2satrec,
  propagate,
  radiansToDegrees,
  shadowFraction,
  sunPos,
  type SatRec,
} from "@/lib/sgp4";

const AU_KM = 149_597_870.7;
const GP_URLS = [
  "https://raw.githubusercontent.com/satvisorcom/satvisor-data/master/celestrak/json/last-30-days.json",
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=JSON",
];
const GP_SOURCE_URL =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=JSON";
const LL_URL =
  "https://ll.thespacedevs.com/2.2.0/launch/?search=Starlink&limit=25&ordering=-net";
const GP_TTL_MS = 2 * 60 * 60 * 1000;
const HORIZON_MS = 48 * 60 * 60 * 1000;
const SUN_STEP_MS = 5 * 60 * 1000;
const SAT_STEP_MS = 30_000;
const MIN_EL_DEG = 10;
const MAX_SUN_EL_DEG = -6;
const MIN_TRAIN = 2;
const SPLIT_GAP_MS = 3 * 60 * 1000;
const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export type SatPass = {
  launchId: string;
  name: string;
  catalogId: number;
  startMs: number;
  endMs: number;
  peakMs: number;
  peakEl: number;
  peakAz: number;
  startAz: number;
  endAz: number;
  rangeKm: number;
};

export type TrainSighting = {
  launchId: string;
  launchName: string;
  launchDate: string;
  satellites: number;
  firstName: string;
  lastName: string;
  startUtc: string;
  peakUtc: string;
  endUtc: string;
  durationMin: number;
  maxElevationDeg: number;
  appears: string;
  highest: string;
  disappears: string;
  rangeKm: number;
};

export type SightingResult = {
  lat: number;
  lon: number;
  horizonHours: number;
  fetchedUtc: string;
  sourceLabel: string;
  sourceUrl: string;
  satelliteCount: number;
  launches: number;
  note: string;
  trains: TrainSighting[];
};

type LaunchLabel = { name: string; date: string };
type GpCache = {
  at: number;
  fetchedUtc: string;
  objects: OMMJsonObject[];
  labels: Map<string, LaunchLabel>;
};
let gpCache: GpCache | null = null;
let missionCache: { at: number; byDate: Map<string, string> } | null = null;

export function launchIdFromObjectId(objectId: string) {
  const match = objectId.match(/^(\d{4}-\d{3})/);
  return match?.[1] ?? objectId;
}

export function compassFromAzimuth(azDeg: number) {
  const heading = ((azDeg % 360) + 360) % 360;
  return COMPASS[Math.round(heading / 22.5) % 16];
}

export function bearing(azDeg: number) {
  return `${compassFromAzimuth(azDeg)} (${Math.round(azDeg)}°)`;
}

export function clusterPasses(passes: SatPass[]): TrainSighting[] {
  const byLaunch = new Map<string, SatPass[]>();
  for (const pass of passes) {
    const list = byLaunch.get(pass.launchId) ?? [];
    list.push(pass);
    byLaunch.set(pass.launchId, list);
  }

  const trains: TrainSighting[] = [];
  for (const [launchId, group] of byLaunch) {
    const events: { t: number; delta: 1 | -1; pass: SatPass }[] = [];
    for (const pass of group) {
      const endMs = Math.max(pass.endMs, pass.startMs + SAT_STEP_MS);
      events.push({ t: pass.startMs, delta: 1, pass });
      events.push({ t: endMs, delta: -1, pass });
    }
    events.sort((a, b) => a.t - b.t || b.delta - a.delta);

    const active = new Set<SatPass>();
    let window: SatPass[] = [];
    let maxCount = 0;
    let lastActiveMs = 0;

    const flush = () => {
      if (maxCount < MIN_TRAIN) {
        window = [];
        maxCount = 0;
        return;
      }
      const byStart = [...window].sort((a, b) => a.startMs - b.startMs);
      const byEnd = [...window].sort((a, b) => a.endMs - b.endMs);
      const peak = window.reduce((best, pass) =>
        pass.peakEl > best.peakEl ? pass : best,
      );
      const startMs = byStart[0].startMs;
      const endMs = byEnd[byEnd.length - 1].endMs;
      trains.push({
        launchId,
        launchName: launchId,
        launchDate: "",
        satellites: new Set(window.map((pass) => pass.catalogId)).size,
        firstName: byStart[0].name,
        lastName: byEnd[byEnd.length - 1].name,
        startUtc: new Date(startMs).toISOString(),
        peakUtc: new Date(peak.peakMs).toISOString(),
        endUtc: new Date(endMs).toISOString(),
        durationMin: Math.max(1, Math.round((endMs - startMs) / 60_000)),
        maxElevationDeg: Math.round(peak.peakEl),
        appears: bearing(byStart[0].startAz),
        highest: bearing(peak.peakAz),
        disappears: bearing(byEnd[byEnd.length - 1].endAz),
        rangeKm: Math.round(peak.rangeKm),
      });
      window = [];
      maxCount = 0;
    };

    for (const event of events) {
      if (
        active.size === 0 &&
        window.length > 0 &&
        event.t - lastActiveMs > SPLIT_GAP_MS
      ) {
        flush();
      }
      if (event.delta === 1) {
        active.add(event.pass);
        window.push(event.pass);
        maxCount = Math.max(maxCount, active.size);
      } else {
        active.delete(event.pass);
      }
      if (active.size > 0) lastActiveMs = event.t;
    }
    flush();
  }

  trains.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return trains;
}

function observerAt(lat: number, lon: number): GeodeticLocation {
  return {
    latitude: degreesToRadians(lat),
    longitude: degreesToRadians(lon),
    height: 0,
  };
}

function sunElevationDeg(date: Date, observer: GeodeticLocation) {
  const sun = sunPos(jday(date));
  const eci = {
    x: sun.rsun.x * AU_KM,
    y: sun.rsun.y * AU_KM,
    z: sun.rsun.z * AU_KM,
  };
  const look = ecfToLookAngles(observer, eciToEcf(eci, gstime(date)));
  return radiansToDegrees(look.elevation);
}

function darkWindows(start: Date, observer: GeodeticLocation) {
  const windows: { startMs: number; endMs: number }[] = [];
  let open: number | null = null;
  const endMs = start.getTime() + HORIZON_MS;
  for (let t = start.getTime(); t <= endMs; t += SUN_STEP_MS) {
    const dark = sunElevationDeg(new Date(t), observer) <= MAX_SUN_EL_DEG;
    if (dark && open === null) open = t;
    if (!dark && open !== null) {
      windows.push({ startMs: open, endMs: t });
      open = null;
    }
  }
  if (open !== null) windows.push({ startMs: open, endMs: endMs });
  return windows;
}

type VisibleSample = {
  t: number;
  az: number;
  el: number;
  rangeKm: number;
};

function passesForSat(
  satrec: SatRec,
  observer: GeodeticLocation,
  windows: { startMs: number; endMs: number }[],
): Omit<SatPass, "launchId" | "name" | "catalogId">[] {
  const found: Omit<SatPass, "launchId" | "name" | "catalogId">[] = [];

  for (const window of windows) {
    let run: VisibleSample[] = [];
    const flush = () => {
      if (run.length === 0) return;
      const peak = run.reduce((best, sample) =>
        sample.el > best.el ? sample : best,
      );
      found.push({
        startMs: run[0].t,
        endMs: run[run.length - 1].t,
        peakMs: peak.t,
        peakEl: peak.el,
        peakAz: peak.az,
        startAz: run[0].az,
        endAz: run[run.length - 1].az,
        rangeKm: peak.rangeKm,
      });
      run = [];
    };

    for (let t = window.startMs; t <= window.endMs; t += SAT_STEP_MS) {
      const date = new Date(t);
      const pv = propagate(satrec, date);
      if (!pv?.position) {
        flush();
        continue;
      }
      const look = ecfToLookAngles(
        observer,
        eciToEcf(pv.position, gstime(date)),
      );
      const el = radiansToDegrees(look.elevation);
      if (el < MIN_EL_DEG) {
        flush();
        continue;
      }
      if (shadowFraction(sunPos(jday(date)).rsun, pv.position) >= 1) {
        flush();
        continue;
      }
      run.push({
        t,
        az: radiansToDegrees(look.azimuth),
        el,
        rangeKm: look.rangeSat,
      });
    }
    flush();
  }
  return found;
}

async function loadStarlinkGp(): Promise<GpCache> {
  if (gpCache && Date.now() - gpCache.at < GP_TTL_MS) return gpCache;
  let objects: OMMJsonObject[] | null = null;
  for (const url of GP_URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "starlink-dashboard/0.1 (train sightings)",
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const body = (await res.json()) as OMMJsonObject[];
      if (Array.isArray(body) && body.length > 0) {
        objects = body;
        break;
      }
    } catch {
      /* try the next source */
    }
  }
  if (!objects) {
    throw new Error("Could not load recent Starlink orbits. Try again in a few minutes.");
  }
  gpCache = {
    at: Date.now(),
    fetchedUtc: new Date().toISOString(),
    objects: objects.filter((omm) => {
      const name = String(omm.OBJECT_NAME).toUpperCase();
      return name.startsWith("STARLINK") && !name.includes("DEB");
    }),
    labels: new Map(),
  };
  return gpCache;
}

function formatLaunchDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function loadMissionNamesByDate() {
  if (missionCache && Date.now() - missionCache.at < GP_TTL_MS) {
    return missionCache.byDate;
  }
  const res = await fetch(LL_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    missionCache = { at: Date.now(), byDate: new Map() };
    return missionCache.byDate;
  }
  const body = (await res.json()) as {
    results?: {
      net?: string;
      name?: string;
      mission?: { name?: string };
    }[];
  };
  const byDate = new Map<string, string>();
  for (const row of body.results ?? []) {
    const date = row.net?.slice(0, 10);
    if (!date || byDate.has(date)) continue;
    const pipe = row.name?.split("|").pop()?.trim();
    byDate.set(date, row.mission?.name || pipe || row.name || date);
  }
  missionCache = { at: Date.now(), byDate };
  return byDate;
}

async function loadLaunchDatesById() {
  const res = await fetch(
    "https://celestrak.org/satcat/records.php?GROUP=last-30-days&FORMAT=JSON",
    {
      headers: {
        "User-Agent": "starlink-dashboard/0.1 (train sightings)",
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return new Map<string, string>();
  const records = (await res.json()) as {
    OBJECT_ID?: string;
    OBJECT_NAME?: string;
    LAUNCH_DATE?: string;
  }[];
  const byId = new Map<string, string>();
  for (const row of records) {
    const name = String(row.OBJECT_NAME ?? "").toUpperCase();
    if (!name.startsWith("STARLINK") || name.includes("DEB")) continue;
    const id = launchIdFromObjectId(String(row.OBJECT_ID ?? ""));
    const date = row.LAUNCH_DATE;
    if (id && date && !byId.has(id)) byId.set(id, date);
  }
  return byId;
}

async function labelLaunches(ids: Iterable<string>) {
  const needed = [...ids].filter((id) => !gpCache?.labels.has(id));
  if (needed.length === 0) return gpCache?.labels ?? new Map();
  const [byDate, dates] = await Promise.all([
    loadMissionNamesByDate(),
    loadLaunchDatesById(),
  ]);
  for (const id of needed) {
    const date = dates.get(id);
    if (!date) continue;
    gpCache?.labels.set(id, {
      name: byDate.get(date) ?? `Starlink launch ${formatLaunchDate(date)}`,
      date: formatLaunchDate(date),
    });
  }
  return gpCache?.labels ?? new Map();
}

export async function findTrainSightings(
  lat: number,
  lon: number,
  now = new Date(),
): Promise<SightingResult> {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  const gp = await loadStarlinkGp();
  const observer = observerAt(lat, lon);
  const nights = darkWindows(now, observer);
  const launches = new Set(
    gp.objects.map((omm) => launchIdFromObjectId(String(omm.OBJECT_ID))),
  );

  const passes: SatPass[] = [];
  if (nights.length > 0) {
    for (const omm of gp.objects) {
      const satrec = json2satrec(omm);
      const satPasses = passesForSat(satrec, observer, nights);
      for (const pass of satPasses) {
        passes.push({
          ...pass,
          launchId: launchIdFromObjectId(String(omm.OBJECT_ID)),
          name: String(omm.OBJECT_NAME),
          catalogId: Number(omm.NORAD_CAT_ID),
        });
      }
    }
  }

  const labels = await labelLaunches(launches);
  const trains = clusterPasses(passes)
    .filter((train) => train.maxElevationDeg >= 20 && train.satellites >= 3)
    .map((train) => {
      const label = labels.get(train.launchId);
      return label
        ? { ...train, launchName: label.name, launchDate: label.date }
        : train;
    });
  const note =
    nights.length === 0
      ? "The Sun stays too high for optical sightings here in the next 48 hours."
      : trains.length === 0
        ? "No visible trains from last-30-day launches in the next 48 hours. Need a dark sky and at least three sunlit satellites 20° up."
        : "Trains are last-30-day launches still flying as a string. Visible means the sky is dark, the satellites are sunlit, and at least three reach 20°.";

  return {
    lat,
    lon,
    horizonHours: 48,
    fetchedUtc: gp.fetchedUtc,
    sourceLabel:
      "CelesTrak GP (last 30 days) and Launch Library 2 for mission names",
    sourceUrl: GP_SOURCE_URL,
    satelliteCount: gp.objects.length,
    launches: launches.size,
    note,
    trains,
  };
}
