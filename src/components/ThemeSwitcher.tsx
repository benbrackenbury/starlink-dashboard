"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  type ThemePref,
} from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSwitcher() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    const stored = readStoredTheme();
    setPref(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = readStoredTheme();
      if (current === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function choose(next: ThemePref) {
    setPref(next);
    storeTheme(next);
    applyTheme(next);
  }

  return (
    <div className="theme-switcher" role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={pref === option.value ? "is-active" : undefined}
          aria-pressed={pref === option.value}
          onClick={() => choose(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
