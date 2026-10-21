import buildings0 from "@/generated/london-buildings-0.json";
import buildings1 from "@/generated/london-buildings-1.json";
import buildings2 from "@/generated/london-buildings-2.json";
import meta from "@/generated/london-city-meta.json";

export type CityBuilding = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  r: number;
  k: number;
};

export type CityLandmark = {
  id: string;
  name: string;
  x: number;
  z: number;
  h: number;
  kind: "shard" | "gherkin" | "tower" | "eye" | "bridge" | "spire";
};

export type CityPark = {
  x: number;
  z: number;
  w: number;
  d: number;
  r: number;
};

export type CityDistrict = {
  id: string;
  name: string;
  x: number;
  z: number;
  k: number;
};

export type CityData = {
  origin: { lat: number; lon: number };
  osmCount: number;
  buildings: CityBuilding[];
  river: number[][];
  docks: number[][][];
  parks: CityPark[];
  landmarks: CityLandmark[];
  districts: CityDistrict[];
};

type PackedBuilding = [number, number, number, number, number, number, number];

function unpack(rows: PackedBuilding[]): CityBuilding[] {
  return rows.map(([x, z, w, d, h, r, k]) => ({ x, z, w, d, h, r, k }));
}

export const LONDON_CITY = {
  ...meta,
  buildings: unpack([
    ...(buildings0 as PackedBuilding[]),
    ...(buildings1 as PackedBuilding[]),
    ...(buildings2 as PackedBuilding[]),
  ]),
} as CityData;
