"use client";

import { useEffect, useRef, useState } from "react";
import {
  jumpToSection,
  PAGE_SECTIONS,
  readActiveSection,
  type SectionId,
} from "@/lib/sections";

export function ContentsNav() {
  const [active, setActive] = useState<SectionId>(PAGE_SECTIONS[0].id);
  const list = useRef<HTMLElement>(null);

  useEffect(() => {
    function update() {
      setActive(readActiveSection());
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function proximity(event: React.PointerEvent<HTMLElement>) {
    const links = list.current?.querySelectorAll<HTMLElement>("a");
    if (!links) return;
    for (const link of links) {
      const box = link.getBoundingClientRect();
      const distance = Math.abs(event.clientY - (box.top + box.height / 2));
      link.style.setProperty("--p", String(Math.max(0, 1 - distance / 64)));
    }
  }

  function clear() {
    list.current?.querySelectorAll<HTMLElement>("a").forEach((link) => {
      link.style.setProperty("--p", "0");
    });
  }

  function go(event: React.MouseEvent<HTMLAnchorElement>, id: SectionId) {
    event.preventDefault();
    jumpToSection(id);
    setActive(id);
    event.currentTarget.blur();
  }

  return (
    <nav
      ref={list}
      className="contents"
      aria-label="On this page"
      onPointerMove={proximity}
      onPointerLeave={clear}
    >
      {PAGE_SECTIONS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={active === item.id ? "is-active" : undefined}
          onClick={(event) => go(event, item.id)}
        >
          <span className="contents-mark" aria-hidden="true" />
          <span className="contents-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
