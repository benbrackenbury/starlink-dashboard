"use client";

import { useEffect, useRef, useState } from "react";
import {
  jumpToSection,
  PAGE_SECTIONS,
  subscribeActiveSection,
  type SectionId,
} from "@/lib/sections";
import { pressProps } from "@/lib/press";

export function ContentsNav() {
  const [active, setActive] = useState<SectionId>(PAGE_SECTIONS[0].id);
  const list = useRef<HTMLElement>(null);

  useEffect(
    () =>
      subscribeActiveSection((id) => {
        setActive((current) => (current === id ? current : id));
      }),
    [],
  );

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

  function go(id: SectionId) {
    jumpToSection(id);
    setActive(id);
  }

  return (
    <nav
      ref={list}
      className="contents"
      aria-label="On This Page"
      onPointerMove={proximity}
      onPointerLeave={clear}
    >
      {PAGE_SECTIONS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={active === item.id ? "is-active" : undefined}
          {...pressProps<HTMLAnchorElement>((event) => {
            go(item.id);
            event.currentTarget.blur();
          })}
        >
          <span className="contents-mark" aria-hidden="true" />
          <span className="contents-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
