import { finance } from "../data/stats";

export type MonthPoint = {
  year: number;
  month: number;
  index: number;
  revenue: number;
  profit: number;
  customers: number;
  projected: boolean;
};

const snapshots = finance.snapshots.map((row) => ({
  ...row,
  index: monthIndex(row.year, row.month),
}));

export function monthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
}

export function fromIndex(index: number) {
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function lerpLog(a: number, b: number, t: number) {
  if (a === b) return a;
  if (a <= 0 || b <= 0) return a + (b - a) * t;
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);
}

const first = snapshots[0];
const last = snapshots[snapshots.length - 1];
const prev = snapshots[snapshots.length - 2];
const span = last.index - prev.index;

export const RANGE = {
  start: monthIndex(finance.range.startYear, finance.range.startMonth),
  end: monthIndex(finance.range.endYear, finance.range.endMonth),
  lastReported: last.index,
};

export function atIndex(index: number): MonthPoint {
  const { year, month } = fromIndex(index);
  if (index <= first.index) {
    return { year, month, index, ...pick(first), projected: false };
  }
  for (let i = 0; i < snapshots.length - 1; i++) {
    const a = snapshots[i];
    const b = snapshots[i + 1];
    if (index <= b.index) {
      if (index === b.index) {
        return { year, month, index, ...pick(b), projected: false };
      }
      const t = (index - a.index) / (b.index - a.index);
      return {
        year,
        month,
        index,
        revenue: lerpLog(a.revenue, b.revenue, t),
        profit: lerpLog(a.profit, b.profit, t),
        customers: lerpLog(a.customers, b.customers, t),
        projected: false,
      };
    }
  }
  const steps = index - last.index;
  return {
    year,
    month,
    index,
    revenue: last.revenue * Math.pow(last.revenue / prev.revenue, steps / span),
    profit: last.profit * Math.pow(last.profit / prev.profit, steps / span),
    customers:
      last.customers * Math.pow(last.customers / prev.customers, steps / span),
    projected: true,
  };
}

function pick(row: (typeof snapshots)[number]) {
  return {
    revenue: row.revenue,
    profit: row.profit,
    customers: row.customers,
  };
}

export function series() {
  const rows: MonthPoint[] = [];
  for (let index = RANGE.start; index <= RANGE.end; index++) {
    rows.push(atIndex(index));
  }
  return rows;
}

export function clampIndex(index: number) {
  return Math.min(RANGE.end, Math.max(RANGE.start, index));
}

export function defaultIndex(now = new Date()) {
  return clampIndex(monthIndex(now.getFullYear(), now.getMonth() + 1));
}

export function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
