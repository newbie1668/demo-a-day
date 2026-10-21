import raw from "@/generated/london-city.json";

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

export const LONDON_CITY = raw as CityData;
