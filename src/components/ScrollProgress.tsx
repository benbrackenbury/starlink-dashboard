"use client";

import { useEffect, useRef, useState } from "react";
import {
  jumpToSection,
  PAGE_SECTIONS,
  readActiveSection,
  type SectionId,
} from "@/lib/sections";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<SVGCircleElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<SectionId>(PAGE_SECTIONS[0].id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${t})`;
      if (fill.current) fill.current.style.strokeDashoffset = String(1 - t);
      const next = readActiveSection();
      setActive((current) => (current === next ? current : next));
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: PointerEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label =
    PAGE_SECTIONS.find((item) => item.id === active)?.label ??
    PAGE_SECTIONS[0].label;

  return (
    <>
      <div ref={bar} className="scroll-progress" aria-hidden="true" />
      <div ref={wrap} className="scroll-pill-wrap">
        {open ? (
          <ul className="scroll-pill-menu">
            {PAGE_SECTIONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === active ? "is-active" : undefined}
                  onClick={() => {
                    jumpToSection(item.id);
                    setActive(item.id);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="scroll-pill"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" className="scroll-pill-track" />
            <circle
              ref={fill}
              cx="10"
              cy="10"
              r="7"
              className="scroll-pill-fill"
              pathLength="1"
            />
          </svg>
          <span>{label}</span>
        </button>
      </div>
    </>
  );
}
