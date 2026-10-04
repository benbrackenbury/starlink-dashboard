export const PAGE_SECTIONS = [
  { id: "orbit", label: "Satellites in orbit" },
  { id: "version", label: "By version" },
  { id: "shells", label: "Inclination shells" },
  { id: "tracks", label: "Ground tracks" },
  { id: "trains", label: "Visible trains" },
  { id: "launches", label: "Launch history" },
  { id: "finance", label: "Revenue and customers" },
  { id: "coverage", label: "Where it operates" },
  { id: "d2c", label: "Direct to Cell" },
] as const;

export type SectionId = (typeof PAGE_SECTIONS)[number]["id"];

export function readActiveSection() {
  const line = window.innerHeight * 0.22;
  let current: SectionId = PAGE_SECTIONS[0].id;
  for (const item of PAGE_SECTIONS) {
    const node = document.getElementById(item.id);
    if (node && node.getBoundingClientRect().top <= line) current = item.id;
  }
  return current;
}

type SectionListener = (id: SectionId) => void;

const sectionListeners = new Set<SectionListener>();
let scrollBound = false;
let scrollTick = 0;

function emitActiveSection() {
  const id = readActiveSection();
  for (const listener of sectionListeners) listener(id);
}

function onViewportChange() {
  if (scrollTick) return;
  scrollTick = window.requestAnimationFrame(() => {
    scrollTick = 0;
    emitActiveSection();
  });
}

function bindSectionListeners() {
  if (scrollBound) return;
  scrollBound = true;
  window.addEventListener("scroll", onViewportChange, { passive: true });
  window.addEventListener("resize", onViewportChange);
}

function unbindSectionListeners() {
  if (!scrollBound) return;
  scrollBound = false;
  window.removeEventListener("scroll", onViewportChange);
  window.removeEventListener("resize", onViewportChange);
  if (scrollTick) {
    window.cancelAnimationFrame(scrollTick);
    scrollTick = 0;
  }
}

export function subscribeActiveSection(listener: SectionListener) {
  sectionListeners.add(listener);
  listener(readActiveSection());
  bindSectionListeners();
  return () => {
    sectionListeners.delete(listener);
    if (sectionListeners.size === 0) unbindSectionListeners();
  };
}

export function jumpToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  node.scrollIntoView({ behavior: "auto", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
