import type { MetadataRoute } from "next";
import { THEME_BG } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Starlink Stats",
    short_name: "Starlink",
    description: "Public Starlink figures with sources and dates.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    lang: "en-GB",
    dir: "ltr",
    background_color: THEME_BG.light,
    theme_color: THEME_BG.light,
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
