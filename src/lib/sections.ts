export const PAGE_SECTIONS = [
  { id: "orbit", label: "Satellites in orbit" },
  { id: "version", label: "By version" },
  { id: "tracks", label: "Ground tracks" },
  { id: "trains", label: "Visible trains" },
  { id: "launches", label: "Launch history" },
  { id: "finance", label: "Revenue and profit" },
  { id: "coverage", label: "Where it operates" },
] as const;

export function readActiveSection() {
  const line = window.innerHeight * 0.22;
  let current = PAGE_SECTIONS[0].id;
  for (const item of PAGE_SECTIONS) {
    const node = document.getElementById(item.id);
    if (node && node.getBoundingClientRect().top <= line) current = item.id;
  }
  return current;
}

export function jumpToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
