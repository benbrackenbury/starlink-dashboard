"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/format";

export function Odometer({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return;
    }
    const id = window.setTimeout(() => setReady(true), 30);
    return () => window.clearTimeout(id);
  }, []);

  const text =
    decimals > 0
      ? value.toLocaleString("en-GB", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : formatCount(value);
  const label = `${prefix}${text}${suffix}`;

  return (
    <span className="odometer" role="img" aria-label={label}>
      <span aria-hidden="true">
        {prefix ? <span className="odometer-affix">{prefix}</span> : null}
        {text.split("").map((ch, index) =>
          /\d/.test(ch) ? (
            <span className="odometer-col" key={`${index}-${ch}`}>
              <span
                className="odometer-strip"
                style={{
                  transform: `translateY(-${ready ? ch : "0"}em)`,
                }}
              >
                {"0123456789".split("").map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            </span>
          ) : (
            <span className="odometer-sep" key={`${index}-${ch}`}>
              {ch}
            </span>
          ),
        )}
        {suffix ? <span className="odometer-affix">{suffix}</span> : null}
      </span>
    </span>
  );
}
