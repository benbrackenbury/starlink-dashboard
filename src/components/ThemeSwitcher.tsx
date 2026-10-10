"use client";

import { useEffect, useState } from "react";
import { pressProps } from "@/lib/press";
import {
  applyOmarchy,
  applyTheme,
  readStoredTheme,
  storeTheme,
  subscribeOmarchy,
  type ThemePref,
} from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d="M12.4 10.2A5.2 5.2 0 0 1 6.3 3.4 5.3 5.3 0 1 0 12.4 10.2Z"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="2.2"
        y="3.2"
        width="11.6"
        height="8"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M6 13.2h4M8 11.2v2"
      />
    </svg>
  );
}

const OPTIONS: {
  value: ThemePref;
  label: string;
  icon: typeof SunIcon;
}[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: SystemIcon },
];

export function ThemeSwitcher() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [omarchyName, setOmarchyName] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredTheme();
    setPref(stored);
    applyTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (window.omarchy && Object.keys(window.omarchy.colors()).length) return;
      const current = readStoredTheme();
      if (current === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    const stopOmarchy = subscribeOmarchy((api) => {
      setOmarchyName(api.theme || "Omarchy");
      applyOmarchy(api);
    });
    return () => {
      media.removeEventListener("change", onChange);
      stopOmarchy();
    };
  }, []);

  function choose(next: ThemePref) {
    setPref(next);
    storeTheme(next);
    applyTheme(next);
  }

  if (omarchyName) {
    return (
      <p className="omarchy-chip" title="Following your Omarchy desktop theme">
        {omarchyName}
      </p>
    );
  }

  return (
    <div className="gooey theme-switcher" role="group" aria-label="Colour Theme">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={pref === option.value ? "is-active" : undefined}
            aria-label={option.label}
            aria-pressed={pref === option.value}
            title={option.label}
            {...pressProps(() => choose(option.value))}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
