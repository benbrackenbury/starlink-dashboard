"use client";

import { useId, useMemo, useState } from "react";
import { Odometer } from "@/components/Odometer";
import { finance } from "@/data/stats";
import { pressProps } from "@/lib/press";
import {
  atIndex,
  monthLabel,
  RANGE,
  series,
  type MonthPoint,
} from "@/lib/outlook";

const CHART = { w: 640, h: 168, padX: 8, padY: 12 };

type SeriesKey = "revenue" | "profit" | "customers";

function linePath(rows: MonthPoint[], key: SeriesKey, max: number) {
  const innerW = CHART.w - CHART.padX * 2;
  const innerH = CHART.h - CHART.padY * 2;
  const span = RANGE.end - RANGE.start;
  return rows
    .map((row, i) => {
      const x = CHART.padX + ((row.index - RANGE.start) / span) * innerW;
      const y = CHART.padY + innerH - (row[key] / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function Chart({
  rows,
  cursor,
}: {
  rows: MonthPoint[];
  cursor: MonthPoint;
}) {
  const split = rows.findIndex((row) => row.projected);
  const reported = split === -1 ? rows : rows.slice(0, split);
  const projected =
    split <= 0 ? [] : [rows[split - 1], ...rows.slice(split)];
  const play =
    CHART.padX +
    ((cursor.index - RANGE.start) / (RANGE.end - RANGE.start)) *
      (CHART.w - CHART.padX * 2);

  const bands: { key: SeriesKey; color: string }[] = [
    { key: "revenue", color: "var(--shell-53)" },
    { key: "profit", color: "var(--shell-70)" },
    { key: "customers", color: "var(--shell-43)" },
  ];

  return (
    <svg
      className="outlook-chart"
      viewBox={`0 0 ${CHART.w} ${CHART.h}`}
      role="img"
      aria-label="Revenue, profit, and subscriber history with a projected tail"
    >
      <line
        className="outlook-play"
        x1={play}
        x2={play}
        y1={4}
        y2={CHART.h - 4}
      />
      {bands.map((band) => {
        const max = Math.max(...rows.map((row) => row[band.key]));
        return (
          <g key={band.key} stroke={band.color} fill="none">
            <path d={linePath(reported, band.key, max)} strokeWidth="2.2" />
            {projected.length > 1 ? (
              <path
                d={linePath(projected, band.key, max)}
                strokeWidth="2.2"
                strokeDasharray="5 4"
                opacity="0.85"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function OutlookPanel() {
  const sliderId = useId();
  const [index, setIndex] = useState(RANGE.lastReported);
  const rows = useMemo(series, []);
  const point = atIndex(index);
  const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <>
      <div className="outlook-metrics">
        <div>
          <div className="figure">
            <Odometer
              value={point.revenue / 1e9}
              prefix="$"
              suffix=" billion"
              decimals={2}
            />
          </div>
          <p className="sub">{finance.revenueLabel}</p>
        </div>
        <div>
          <div className="figure">
            <Odometer
              value={point.profit / 1e9}
              prefix="$"
              suffix=" billion"
              decimals={2}
            />
          </div>
          <p className="sub">{finance.profitLabel}</p>
        </div>
        <div id="customers">
          <div className="figure">
            <Odometer
              value={point.customers / 1e6}
              suffix=" million"
              decimals={1}
            />
          </div>
          <p className="sub">{finance.customersLabel}</p>
        </div>
      </div>

      <Chart rows={rows} cursor={point} />
      <p className="outlook-legend">
        <span>
          <i className="outlook-swatch" data-series="revenue" /> Revenue
        </span>
        <span>
          <i className="outlook-swatch" data-series="profit" /> Profit
        </span>
        <span>
          <i className="outlook-swatch" data-series="customers" /> Subscribers
        </span>
        <span>Dashed = last reported growth held still</span>
      </p>

      <div className="outlook-scrub">
        <div className="outlook-scrub-head">
          <label htmlFor={sliderId}>
            As of {monthLabel(point.year, point.month)}
          </label>
          <span className={point.projected ? "outlook-chip is-est" : "outlook-chip"}>
            {point.projected ? "Projected" : "Reported"}
          </span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={RANGE.start}
          max={RANGE.end}
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
        />
        <div className="outlook-years">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              className={point.year === year ? "is-active" : undefined}
              {...pressProps(() => setIndex(year * 12 + 11))}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
