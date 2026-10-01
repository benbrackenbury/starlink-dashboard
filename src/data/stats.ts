export type Source = {
  label: string;
  url: string;
  published: string;
};

export const pageFetched = "1 October 2026";

export const constellation = {
  totalInOrbit: 11119,
  totalWorking: 11078,
  versions: [
    {
      name: "V1 / Gen1",
      note: "Includes V1.0 and V1.5 shells in McDowell’s Gen1 subtotal.",
      inOrbit: 3203,
      working: 3191,
    },
    {
      name: "V2 Mini / Gen2",
      note: "McDowell’s Gen2 subtotal (V2 Mini and V2 Mini/Opt shells).",
      inOrbit: 7890,
      working: 7887,
    },
    {
      name: "V3 / Gen3",
      note: "Starship Flight 14 (Starlink Group 31-1) on 28 September 2026 deployed 26 V3 satellites. SpaceX reported contact with all 26; they are in on-orbit checkout and orbit-raising, not yet counted as serving customers. McDowell’s 31 August census predates this launch and listed 20 earlier V3s that failed to reach orbit.",
      inOrbit: 26,
      working: 0,
    },
  ],
  source: {
    label: "Jonathan McDowell, Starlink launch statistics",
    url: "https://planet4589.org/space/con/star/stats.html",
    published: "31 August 2026 (V1/V2 totals; V3 row predates Flight 14)",
  } satisfies Source,
  sourceV3: {
    label: "SpaceX, Starship Flight 14",
    url: "https://www.spacex.com/launches/starship-flight-14/",
    published: "28 September 2026",
  } satisfies Source,
};

export const launches = {
  recent: [
    {
      name: "Starlink Group 31-1 (Starship Flight 14)",
      date: "28 September 2026, 12:48 UTC",
      site: "Starbase, Texas",
      payload: "26 Starlink V3 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-27",
      date: "20 September 2026, 01:47 UTC",
      site: "Vandenberg SFB, California",
      payload: "27 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-24",
      date: "6 September 2026, 14:26 UTC",
      site: "Vandenberg SFB, California",
      payload: "27 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-23",
      date: "2 September 2026, 08:42 UTC",
      site: "Vandenberg SFB, California",
      payload: "27 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-22",
      date: "26 August 2026, 09:35 UTC",
      site: "Vandenberg SFB, California",
      payload: "27 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 10-49",
      date: "25 August 2026, 09:33 UTC",
      site: "Cape Canaveral SFS, Florida",
      payload: "29 satellites",
      status: "Launch successful",
    },
  ],
  upcoming: [
    {
      name: "Starlink Group 15-25",
      date: "10 October 2026, 23:00 UTC (NET)",
      site: "Vandenberg SFB, SLC-4E",
      payload: "27 satellites",
      status: "Go for launch",
    },
  ],
  source: {
    label: "The Space Devs Launch Library 2 API",
    url: "https://ll.thespacedevs.com/2.2.0/launch/previous/?search=Starlink&limit=6",
    published: "Fetched 1 October 2026",
  } satisfies Source,
  upcomingSource: {
    label: "The Space Devs Launch Library 2 (upcoming) and SpaceX mission page",
    url: "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?search=Starlink&limit=8",
    published: "API last updated 30 September 2026; SpaceX page dated 30 September 2026",
  } satisfies Source,
};

export const finance = {
  year: "2025",
  revenue: "$11.39 billion",
  profit: "$4.42 billion",
  revenueLabel: "Connectivity unit revenue (primarily Starlink)",
  profitLabel: "Connectivity unit operating income",
  caveat:
    "Figures are SpaceX prospectus numbers for 2025 as reported by CNBC, not a 2026 forecast. They cover the connectivity unit, which CNBC says is primarily Starlink.",
  source: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    published: "21 May 2026",
  } satisfies Source,
};

export const coverage = {
  official: "150+ countries, territories, and other markets",
  prospectus: "Over 160 countries; available on all seven continents",
  sourceOfficial: {
    label: "Starlink availability map",
    url: "https://starlink.com/map",
    published: "Fetched 1 October 2026",
  } satisfies Source,
  sourceProspectus: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    published: "21 May 2026",
  } satisfies Source,
};
