export type Source = {
  label: string;
  url: string;
  publishedIso: string;
  publishedNote?: string;
};

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
    publishedIso: "2026-08-31",
    publishedNote: "V1/V2 totals; V3 row predates Flight 14",
  } satisfies Source,
  sourceV3: {
    label: "SpaceX, Starship Flight 14",
    url: "https://www.spacex.com/launches/starship-flight-14/",
    publishedIso: "2026-09-28",
  } satisfies Source,
};

export const launches = {
  recent: [
    {
      name: "Starlink Group 31-1 (Starship Flight 14)",
      dateIso: "2026-09-28T12:48:00Z",
      site: "Starbase, Texas",
      payload: "26\u00a0Starlink V3 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-27",
      dateIso: "2026-09-20T01:47:00Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-24",
      dateIso: "2026-09-06T14:26:00Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-23",
      dateIso: "2026-09-02T08:42:00Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-22",
      dateIso: "2026-08-26T09:35:00Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 10-49",
      dateIso: "2026-08-25T09:33:00Z",
      site: "Cape Canaveral SFS, Florida",
      payload: "29\u00a0satellites",
      status: "Launch successful",
    },
  ],
  upcoming: [
    {
      name: "Starlink Group 15-25",
      dateIso: "2026-10-10T23:00:00Z",
      net: true,
      site: "Vandenberg SFB, SLC-4E",
      payload: "27\u00a0satellites",
      status: "Go for launch",
    },
  ],
  source: {
    label: "The Space Devs Launch Library 2 API",
    url: "https://ll.thespacedevs.com/2.2.0/launch/previous/?search=Starlink&limit=6",
    publishedIso: "2026-10-01",
    publishedNote: "Fetched",
  } satisfies Source,
  upcomingSource: {
    label: "The Space Devs Launch Library 2 (upcoming) and SpaceX mission page",
    url: "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?search=Starlink&limit=8",
    publishedIso: "2026-09-30",
    publishedNote: "API last updated; SpaceX page same day",
  } satisfies Source,
};

export const finance = {
  revenueLabel: "Connectivity revenue, trailing twelve months",
  profitLabel: "Connectivity operating income, trailing twelve months",
  customersLabel: "Starlink subscribers (service lines)",
  caveat:
    "Solid line is prospectus history. After March 2026 the dashed line holds the last reported growth rate still. That is not a SpaceX forecast. Revenue and profit after year-end 2025 are trailing twelve months: 2025 plus Q1 2026 minus Q1 2025. The connectivity unit is primarily Starlink.",
  source: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    publishedIso: "2026-05-21",
  } satisfies Source,
  sourceFiling: {
    label: "SpaceX free writing prospectus, connectivity tables",
    url: "https://www.sec.gov/Archives/edgar/data/1181412/000162828026040610/spacexfwp.htm",
    publishedIso: "2026-03-31",
    publishedNote:
      "Prospectus tables for 2023–2025 and the quarter ended 31 March 2026",
  } satisfies Source,
  snapshots: [
    {
      year: 2023,
      month: 12,
      revenue: 3_869_000_000,
      profit: 469_000_000,
      customers: 2_300_000,
    },
    {
      year: 2024,
      month: 12,
      revenue: 7_599_000_000,
      profit: 2_006_000_000,
      customers: 4_400_000,
    },
    {
      year: 2025,
      month: 12,
      revenue: 11_387_000_000,
      profit: 4_423_000_000,
      customers: 8_900_000,
    },
    {
      year: 2026,
      month: 3,
      revenue: 12_169_000_000,
      profit: 4_578_000_000,
      customers: 10_300_000,
    },
  ],
  range: { startYear: 2023, startMonth: 12, endYear: 2030, endMonth: 12 },
};

export const coverage = {
  official: "150+\u00a0countries, territories, and other markets",
  prospectus: "Over 160\u00a0countries; available on all seven continents",
  sourceOfficial: {
    label: "Starlink availability map",
    url: "https://starlink.com/map",
    publishedIso: "2026-10-01",
    publishedNote: "Fetched",
  } satisfies Source,
  sourceProspectus: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    publishedIso: "2026-05-21",
  } satisfies Source,
};

export const shells = {
  rows: [
    {
      id: "53",
      name: "53°",
      altitude: "~550 km",
      note: "Main mid-latitude shells (53.0° and 53.2°).",
      inOrbit: 7812,
    },
    {
      id: "43",
      name: "43°",
      altitude: "~560 km",
      note: "Lower-inclination planes for denser coverage at temperate latitudes.",
      inOrbit: 1496,
    },
    {
      id: "70",
      name: "70°",
      altitude: "~530 km",
      note: "High-latitude shell.",
      inOrbit: 1328,
    },
    {
      id: "97",
      name: "97°",
      altitude: "~560 km",
      note: "Near-polar sun-synchronous planes.",
      inOrbit: 483,
    },
  ],
  source: {
    label: "Jonathan McDowell, Starlink launch statistics",
    url: "https://planet4589.org/space/con/star/stats.html",
    publishedIso: "2026-08-31",
    publishedNote:
      "inclination bins grouped to the four shells used on the map",
  } satisfies Source,
};

export const directToCell = {
  headline: "Text service on partner networks",
  note: "V2 Mini satellites carry a Direct to Cell payload. SpaceX describes current service as text, with voice and data still rolling out by market.",
  partners: [
    { name: "T-Mobile", market: "United States", status: "Live (text)" },
    { name: "Rogers", market: "Canada", status: "Live (text)" },
    { name: "Optus", market: "Australia", status: "Live (text)" },
    { name: "One NZ", market: "New Zealand", status: "Live (text)" },
    { name: "KDDI", market: "Japan", status: "Announced" },
  ],
  source: {
    label: "SpaceX, Direct to Cell",
    url: "https://www.starlink.com/business/direct-to-cell",
    publishedIso: "2026-10-01",
    publishedNote: "Fetched",
  } satisfies Source,
};
