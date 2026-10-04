"use client";

import { useEffect, useRef, useState } from "react";
import {
  jumpToSection,
  PAGE_SECTIONS,
  subscribeActiveSection,
  type SectionId,
} from "@/lib/sections";
import { pressProps } from "@/lib/press";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<SVGCircleElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<SectionId>(PAGE_SECTIONS[0].id);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let tick = 0;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${t})`;
      if (fill.current) fill.current.style.strokeDashoffset = String(1 - t);
    }
    function onScroll() {
      if (tick) return;
      tick = window.requestAnimationFrame(() => {
        tick = 0;
        update();
      });
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const stopSection = subscribeActiveSection((id) => {
      setActive((current) => (current === id ? current : id));
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | undefined;
    if (!reduce) {
      const nodes = document.querySelectorAll(
        ".page-head, main>section, .grid>section",
      );
      io = new IntersectionObserver(
        (entries) => {
          const shown = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          shown.forEach((entry, index) => {
            const el = entry.target as HTMLElement;
            el.style.transitionDelay = `${index * 70}ms`;
            el.classList.add("is-in");
            io?.unobserve(el);
          });
        },
        { threshold: 0.06, rootMargin: "0px 0px -8% 0px" },
      );
      nodes.forEach((node) => io?.observe(node));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (tick) window.cancelAnimationFrame(tick);
      stopSection();
      io?.disconnect();
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
          <ul className="scroll-pill-menu" id="scroll-pill-menu">
            {PAGE_SECTIONS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={item.id === active ? "is-active" : undefined}
                  {...pressProps(() => {
                    jumpToSection(item.id);
                    setActive(item.id);
                    setOpen(false);
                  })}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="scroll-pill"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls="scroll-pill-menu"
          aria-label={`On This Page, ${label}`}
          {...pressProps(() => setOpen((value) => !value))}
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
