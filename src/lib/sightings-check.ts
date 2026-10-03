import assert from "node:assert/strict";
import { bearing, clusterPasses, launchIdFromObjectId } from "./sightings";

assert.equal(launchIdFromObjectId("2026-204A"), "2026-204");
assert.equal(launchIdFromObjectId("2025-280K"), "2025-280");
assert.equal(bearing(0), "N (0°)");
assert.equal(bearing(90), "E (90°)");

function pass(
  launchId: string,
  name: string,
  catalogId: number,
  startMs: number,
  endMs: number,
  peakEl: number,
): Parameters<typeof clusterPasses>[0][number] {
  return {
    launchId,
    name,
    catalogId,
    startMs,
    endMs,
    peakMs: (startMs + endMs) / 2,
    peakEl,
    peakAz: 180,
    startAz: 160,
    endAz: 200,
    rangeKm: 500,
  };
}

const trains = clusterPasses([
  pass("2026-204", "STARLINK-A", 1, 1_000_000, 1_180_000, 40),
  pass("2026-204", "STARLINK-B", 2, 1_040_000, 1_220_000, 55),
  pass("2026-204", "STARLINK-Z", 9, 1_050_000, 1_050_000, 12),
  pass("2026-204", "STARLINK-E", 5, 87_400_000, 87_580_000, 33),
  pass("2026-204", "STARLINK-F", 6, 87_440_000, 87_620_000, 38),
  pass("2026-219", "STARLINK-C", 3, 2_000_000, 2_100_000, 20),
  pass("2026-219", "STARLINK-D", 4, 2_020_000, 2_120_000, 22),
]);

assert.equal(trains.length, 3);
assert.equal(trains[0].launchId, "2026-204");
assert.equal(trains[0].satellites, 3);
assert.equal(trains[0].maxElevationDeg, 55);
assert.equal(trains[1].launchId, "2026-219");
assert.equal(trains[1].satellites, 2);
assert.equal(trains[2].launchId, "2026-204");
assert.equal(trains[2].satellites, 2);

console.log("sightings check ok");
