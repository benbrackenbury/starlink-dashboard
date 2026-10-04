import assert from "node:assert/strict";
import {
  atIndex,
  defaultIndex,
  lerpLog,
  monthIndex,
  RANGE,
  series,
} from "./outlook";

assert.equal(monthIndex(2023, 12), 2023 * 12 + 11);
assert.equal(atIndex(monthIndex(2025, 12)).revenue, 11_387_000_000);
assert.equal(atIndex(monthIndex(2025, 12)).customers, 8_900_000);
assert.equal(atIndex(monthIndex(2026, 3)).projected, false);
assert.equal(atIndex(monthIndex(2026, 4)).projected, true);

const mid = atIndex(monthIndex(2024, 6));
assert.ok(mid.revenue > 3_869_000_000 && mid.revenue < 7_599_000_000);
assert.equal(lerpLog(100, 100, 0.5), 100);

const later = atIndex(monthIndex(2027, 3));
const last = atIndex(RANGE.lastReported);
assert.ok(later.revenue > last.revenue);
assert.ok(later.customers > last.customers);

const rows = series();
assert.equal(rows[0].index, RANGE.start);
assert.equal(rows.at(-1)?.index, RANGE.end);
assert.equal(rows.length, RANGE.end - RANGE.start + 1);

const clamped = defaultIndex(new Date(Date.UTC(2019, 0, 1)));
assert.equal(clamped, RANGE.start);

console.log("outlook check ok");
