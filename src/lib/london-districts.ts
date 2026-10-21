export type DistrictId =
  | "canary"
  | "shoreditch"
  | "old-street"
  | "kings-cross"
  | "soho"
  | "southbank"
  | "hackney"
  | "paddington";

export type District = {
  id: DistrictId;
  name: string;
  note: string;
  color: string;
  accent: string;
};

export const DISTRICTS: District[] = [
  {
    id: "canary",
    name: "Canary Wharf",
    note: "Towers on the water. The case that this could be London's SF starts here.",
    color: "#d4b483",
    accent: "#f0d7a4",
  },
  {
    id: "shoreditch",
    name: "Shoreditch",
    note: "Roundabout gravity. Seed-stage density, agencies, and the walkable bit.",
    color: "#c56a4a",
    accent: "#e08968",
  },
  {
    id: "old-street",
    name: "Old Street",
    note: "Silicon Roundabout. Still the default first desk.",
    color: "#b85a48",
    accent: "#d47864",
  },
  {
    id: "kings-cross",
    name: "King's Cross",
    note: "Coal Drops, Google, and the knowledge quarter pulling north.",
    color: "#6a93a8",
    accent: "#8fb4c6",
  },
  {
    id: "soho",
    name: "Soho",
    note: "Media, AI film tools, and rooms that still take walk-ins.",
    color: "#c46b88",
    accent: "#e08aa5",
  },
  {
    id: "southbank",
    name: "South Bank",
    note: "River-facing studios. The skyline you want behind a demo.",
    color: "#4e8c96",
    accent: "#73b0b8",
  },
  {
    id: "hackney",
    name: "Hackney Wick",
    note: "Yards and warehouses. Hardware and climate tucked behind the canal.",
    color: "#6f9a52",
    accent: "#90b872",
  },
  {
    id: "paddington",
    name: "Paddington",
    note: "Basin offices and the Elizabeth line. A quieter corporate edge.",
    color: "#7d6ea8",
    accent: "#9d90c4",
  },
];

export const DISTRICT_BY_ID: Record<DistrictId, District> = Object.fromEntries(
  DISTRICTS.map((d) => [d.id, d]),
) as Record<DistrictId, District>;

const DISTRICT_INDEX: Record<string, number> = {
  fabric: 0,
  canary: 1,
  shoreditch: 2,
  "old-street": 3,
  "kings-cross": 4,
  soho: 5,
  southbank: 6,
  hackney: 7,
  paddington: 8,
};

export function districtIdFromIndex(index: number): DistrictId | null {
  if (index <= 0 || index >= DISTRICTS.length + 1) return null;
  return DISTRICTS[index - 1]?.id ?? null;
}

export function indexFromDistrictId(id: string): number {
  return DISTRICT_INDEX[id] ?? 0;
}

export function isDistrictId(value: string): value is DistrictId {
  return value in DISTRICT_BY_ID;
}
