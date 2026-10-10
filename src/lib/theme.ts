export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "starlink-theme";
export const THEME_BG: Record<ResolvedTheme, string> = {
  light: "#f6f6f6",
  dark: "#101010",
};

export type OmarchyApi = {
  theme: string;
  mode: string;
  color(name: string): string | undefined;
  colors(): Record<string, string>;
  onChange(cb: (colors: Record<string, string>) => void): () => void;
};

declare global {
  interface Window {
    omarchy?: OmarchyApi;
  }
}

export function isThemePref(value: string | null | undefined): value is ThemePref {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

export function syncThemeColor(resolved: ResolvedTheme, color = THEME_BG[resolved]) {
  const nodes = document.querySelectorAll('meta[name="theme-color"]');
  if (!nodes.length) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
    return;
  }
  const first = nodes[0];
  first.removeAttribute("media");
  first.setAttribute("content", color);
  for (let i = 1; i < nodes.length; i++) nodes[i].remove();
}

export function applyTheme(pref: ThemePref) {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  root.style.colorScheme = resolved;
  syncThemeColor(resolved);
}

export function applyOmarchy(api: OmarchyApi) {
  const resolved: ResolvedTheme = api.mode === "light" ? "light" : "dark";
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const bg = api.color("background")?.trim();
  syncThemeColor(resolved, bg || THEME_BG[resolved]);
}

export function subscribeOmarchy(onLive: (api: OmarchyApi) => void): () => void {
  let unsub: (() => void) | undefined;

  const bind = () => {
    const api = window.omarchy;
    if (!api) return false;
    if (unsub) return true;
    unsub = api.onChange((colors) => {
      if (Object.keys(colors).length) onLive(api);
    });
    if (Object.keys(api.colors()).length) onLive(api);
    return true;
  };

  const tick = window.setInterval(() => {
    if (bind()) window.clearInterval(tick);
  }, 300);
  const kill = window.setTimeout(() => window.clearInterval(tick), 8000);
  const mo = new MutationObserver(() => {
    if (bind()) {
      window.clearInterval(tick);
      window.clearTimeout(kill);
    }
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-omarchy-theme", "data-omarchy-mode"],
  });
  bind();
  return () => {
    window.clearInterval(tick);
    window.clearTimeout(kill);
    mo.disconnect();
    unsub?.();
  };
}

export function readStoredTheme(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemePref(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function storeTheme(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* ignore quota / private mode */
  }
}

export const themeBootScript = `(function(){
  var key=${JSON.stringify(THEME_KEY)};
  var pref='system';
  try {
    var stored=localStorage.getItem(key);
    if(stored==='light'||stored==='dark'||stored==='system') pref=stored;
  } catch(e) {}
  var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  var resolved=pref==='system'?(dark?'dark':'light'):pref;
  var root=document.documentElement;
  var omMode=root.getAttribute('data-omarchy-mode');
  if(omMode==='light'||omMode==='dark') resolved=omMode;
  root.dataset.theme=resolved;
  root.dataset.themePref=pref;
  root.style.colorScheme=resolved;
  var color=resolved==='dark'?${JSON.stringify(THEME_BG.dark)}:${JSON.stringify(THEME_BG.light)};
  var omBg=getComputedStyle(root).getPropertyValue('--omarchy-background').trim();
  if(omBg) color=omBg;
  var metas=document.querySelectorAll('meta[name="theme-color"]');
  if(!metas.length){
    var tag=document.createElement('meta');
    tag.setAttribute('name','theme-color');
    tag.setAttribute('content',color);
    document.head.appendChild(tag);
  } else {
    metas[0].removeAttribute('media');
    metas[0].setAttribute('content',color);
    for(var t=1;t<metas.length;t++) metas[t].parentNode.removeChild(metas[t]);
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('reveal-pending');
  }
})();`;
