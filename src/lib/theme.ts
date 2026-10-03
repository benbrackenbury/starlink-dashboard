export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "starlink-theme";

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

export function applyTheme(pref: ThemePref) {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  root.style.colorScheme = resolved;
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
  root.dataset.theme=resolved;
  root.dataset.themePref=pref;
  root.style.colorScheme=resolved;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('reveal-pending');
  function bind(){
    var nodes=document.querySelectorAll('.page-head, main>section, .grid>section');
    var io=new IntersectionObserver(function(ents){
      var shown=[];
      for (var i=0;i<ents.length;i++) if (ents[i].isIntersecting) shown.push(ents[i]);
      shown.sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top});
      for (var j=0;j<shown.length;j++){
        var el=shown[j].target;
        el.style.transitionDelay=(j*70)+'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },{threshold:0.06,rootMargin:'0px 0px -8% 0px'});
    for (var k=0;k<nodes.length;k++) io.observe(nodes[k]);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();`;
