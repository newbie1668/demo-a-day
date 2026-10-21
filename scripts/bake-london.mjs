#!/usr/bin/env node
/**
 * Bake a static Central London massing file. Tries Overpass for building
 * footprints (no API key). Always writes a geographically correct Thames,
 * parks, docks, and named landmarks so the scene still reads as London if
 * Overpass is empty or slow.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN_LAT = 51.5074;
const ORIGIN_LON = -0.0877;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN_LAT * Math.PI) / 180);

const DISTRICTS = [
  { id: "fabric", name: "London", lat: 51.5074, lon: -0.0877 },
  { id: "canary", name: "Canary Wharf", lat: 51.5054, lon: -0.0235 },
  { id: "shoreditch", name: "Shoreditch", lat: 51.5256, lon: -0.0774 },
  { id: "old-street", name: "Old Street", lat: 51.5257, lon: -0.0875 },
  { id: "kings-cross", name: "King's Cross", lat: 51.5312, lon: -0.1238 },
  { id: "soho", name: "Soho", lat: 51.5136, lon: -0.1357 },
  { id: "southbank", name: "South Bank", lat: 51.5064, lon: -0.1162 },
  { id: "hackney", name: "Hackney Wick", lat: 51.5436, lon: -0.0234 },
  { id: "paddington", name: "Paddington", lat: 51.5175, lon: -0.176 },
];

const LANDMARKS = [
  { id: "shard", name: "The Shard", lat: 51.5045, lon: -0.0865, h: 310, kind: "shard" },
  { id: "gherkin", name: "The Gherkin", lat: 51.5145, lon: -0.0803, h: 180, kind: "gherkin" },
  { id: "ocs", name: "One Canada Square", lat: 51.505, lon: -0.0196, h: 235, kind: "tower" },
  { id: "walkie", name: "20 Fenchurch", lat: 51.5114, lon: -0.0837, h: 160, kind: "tower" },
  { id: "leadenhall", name: "Leadenhall", lat: 51.5139, lon: -0.0822, h: 225, kind: "tower" },
  { id: "bishopsgate", name: "22 Bishopsgate", lat: 51.5145, lon: -0.0829, h: 278, kind: "tower" },
  { id: "heron", name: "Salesforce Tower", lat: 51.5162, lon: -0.0808, h: 230, kind: "tower" },
  { id: "stpauls", name: "St Paul's", lat: 51.5138, lon: -0.0984, h: 111, kind: "spire" },
  { id: "bt", name: "BT Tower", lat: 51.5215, lon: -0.139, h: 177, kind: "tower" },
  { id: "eye", name: "London Eye", lat: 51.5033, lon: -0.1196, h: 135, kind: "eye" },
  { id: "bigben", name: "Elizabeth Tower", lat: 51.5007, lon: -0.1246, h: 96, kind: "spire" },
  { id: "pinnacle", name: "Landmark Pinnacle", lat: 51.5025, lon: -0.0188, h: 233, kind: "tower" },
  { id: "tower42", name: "Tower 42", lat: 51.5153, lon: -0.0839, h: 183, kind: "tower" },
  { id: "tower-bridge", name: "Tower Bridge", lat: 51.5055, lon: -0.0754, h: 65, kind: "bridge" },
  { id: "london-bridge", name: "London Bridge", lat: 51.5079, lon: -0.0875, h: 18, kind: "bridge" },
  { id: "westminster-bridge", name: "Westminster Bridge", lat: 51.5009, lon: -0.1217, h: 16, kind: "bridge" },
];

const PARKS = [
  { lat: 51.5073, lon: -0.1657, w: 900, d: 520, r: 0.15 },
  { lat: 51.5312, lon: -0.1569, w: 780, d: 720, r: 0.05 },
  { lat: 51.5035, lon: -0.1438, w: 280, d: 190, r: 0.4 },
  { lat: 51.5022, lon: -0.1348, w: 360, d: 260, r: 0.2 },
  { lat: 51.5366, lon: -0.0378, w: 820, d: 420, r: 0.1 },
  { lat: 51.5048, lon: -0.0985, w: 220, d: 160, r: 0.3 },
  { lat: 51.511, lon: -0.1575, w: 400, d: 180, r: 0.0 },
];

const THAMES_LONLAT = [
  [-0.1637, 51.4848],
  [-0.1519, 51.4871],
  [-0.1448, 51.4874],
  [-0.137, 51.4875],
  [-0.1273, 51.4878],
  [-0.1255, 51.4955],
  [-0.1238, 51.4988],
  [-0.1223, 51.501],
  [-0.1197, 51.5036],
  [-0.1165, 51.506],
  [-0.1085, 51.5088],
  [-0.1018, 51.5089],
  [-0.094, 51.5085],
  [-0.0875, 51.5079],
  [-0.0803, 51.5065],
  [-0.0754, 51.5055],
  [-0.069, 51.5048],
  [-0.06, 51.5062],
  [-0.05, 51.508],
  [-0.04, 51.5095],
  [-0.032, 51.511],
  [-0.027, 51.5088],
  [-0.022, 51.5075],
  [-0.015, 51.5072],
  [-0.009, 51.5065],
  [-0.0065, 51.503],
  [-0.007, 51.498],
  [-0.0095, 51.493],
  [-0.013, 51.4875],
  [-0.009, 51.4845],
];

const DOCKS = [
  [
    [51.5064, -0.0272],
    [51.5066, -0.0178],
    [51.505, -0.0176],
    [51.5048, -0.027],
  ],
  [
    [51.4988, -0.0235],
    [51.4992, -0.0188],
    [51.4966, -0.0184],
    [51.4962, -0.0232],
  ],
];

const OSM_BOXES = [
  [51.5035, -0.026, 51.5075, -0.018],
  [51.5015, -0.022, 51.505, -0.014],
  [51.5125, -0.09, 51.5165, -0.081],
  [51.513, -0.082, 51.5175, -0.074],
  [51.523, -0.09, 51.527, -0.08],
  [51.5235, -0.08, 51.5275, -0.07],
  [51.4995, -0.128, 51.5045, -0.116],
  [51.504, -0.12, 51.5085, -0.11],
  [51.5115, -0.14, 51.5155, -0.13],
  [51.529, -0.128, 51.5335, -0.118],
  [51.5155, -0.18, 51.5195, -0.17],
  [51.541, -0.028, 51.545, -0.018],
  [51.507, -0.1, 51.511, -0.092],
  [51.502, -0.09, 51.506, -0.082],
];

const OVERPASS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function toXZ(lat, lon) {
  const x = (lon - ORIGIN_LON) * M_PER_DEG_LON;
  const z = (ORIGIN_LAT - lat) * M_PER_DEG_LAT;
  return [x, z];
}

function round(n, p = 1) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function nearestDistrict(x, z) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 1; i < DISTRICTS.length; i += 1) {
    const [dx, dz] = toXZ(DISTRICTS[i].lat, DISTRICTS[i].lon);
    const d = dist2(x, z, dx, dz);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return bestD < 700 * 700 ? best : 0;
}

function resampleSimple(points, spacing) {
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(len / spacing));
    for (let s = 0; s < n; s += 1) {
      const t = s / n;
      out.push([x0 + (x1 - x0) * t, z0 + (z1 - z0) * t]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function riverWidth(x, z) {
  const [cx, cz] = toXZ(51.505, -0.02);
  const nearCanary = Math.sqrt(dist2(x, z, cx, cz)) < 1800;
  return nearCanary ? 280 : 210;
}

function onWater(x, z, river) {
  let min = Infinity;
  for (const [rx, rz] of river) {
    const d = dist2(x, z, rx, rz);
    if (d < min) min = d;
  }
  const width = riverWidth(x, z);
  return min < (width * 0.55) ** 2;
}

function inPark(x, z, parks) {
  for (const park of parks) {
    const dx = x - park.x;
    const dz = z - park.z;
    const c = Math.cos(-park.r);
    const s = Math.sin(-park.r);
    const lx = dx * c - dz * s;
    const lz = dx * s + dz * c;
    if (Math.abs(lx) < park.w / 2 && Math.abs(lz) < park.d / 2) return true;
  }
  return false;
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function parseHeight(tags) {
  if (!tags) return null;
  if (tags.height) {
    const n = Number.parseFloat(String(tags.height).replace(/m/gi, "").trim());
    if (Number.isFinite(n) && n > 3) return Math.min(n, 310);
  }
  if (tags["building:levels"]) {
    const n = Number.parseFloat(tags["building:levels"]);
    if (Number.isFinite(n) && n > 0) return Math.min(n * 3.2, 310);
  }
  return null;
}

function orientedBox(coords) {
  if (coords.length < 3) return null;
  let best = null;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [x0, z0] = coords[i];
    const [x1, z1] = coords[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len < 2) continue;
    const ux = (x1 - x0) / len;
    const uz = (z1 - z0) / len;
    const vx = -uz;
    const vz = ux;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [x, z] of coords) {
      const u = x * ux + z * uz;
      const v = x * vx + z * vz;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const w = maxU - minU;
    const d = maxV - minV;
    const area = w * d;
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2;
      const cv = (minV + maxV) / 2;
      best = {
        area,
        x: cu * ux + cv * vx,
        z: cu * uz + cv * vz,
        w,
        d,
        r: Math.atan2(uz, ux),
      };
    }
  }
  return best;
}

async function overpass(query) {
  let lastErr = null;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "User-Agent": "demo-a-day-london-baker/1.0" },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(22000),
      });
      if (!res.ok) {
        lastErr = new Error(`${url} ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("overpass failed");
}

async function fetchOsmBuildings() {
  const buildings = [];
  for (const [s, w, n, e] of OSM_BOXES) {
    const query = `[out:json][timeout:20];way["building"](${s},${w},${n},${e});out geom 90;`;
    try {
      const data = await overpass(query);
      const ways = Array.isArray(data.elements) ? data.elements : [];
      for (const way of ways) {
        if (!way.geometry || way.geometry.length < 4) continue;
        const coords = way.geometry.map((p) => toXZ(p.lat, p.lon));
        const box = orientedBox(coords);
        if (!box) continue;
        const wdt = Math.max(box.w, 6);
        const dpt = Math.max(box.d, 6);
        if (wdt > 180 || dpt > 180) continue;
        if (wdt * dpt < 70) continue;
        const h = parseHeight(way.tags) ?? Math.max(10, Math.min(28, Math.sqrt(wdt * dpt) * 0.45));
        buildings.push({
          x: round(box.x),
          z: round(box.z),
          w: round(wdt),
          d: round(dpt),
          h: round(h),
          r: round(box.r, 3),
          k: nearestDistrict(box.x, box.z),
        });
      }
      console.log(`OSM bbox ${w},${s} ${e},${n}: ${ways.length} ways, kept ${buildings.length} total`);
      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (err) {
      console.warn(`OSM bbox ${w},${s} failed:`, err instanceof Error ? err.message : err);
    }
  }
  buildings.sort((a, b) => b.h - a.h);
  const capped = [];
  const seen = [];
  for (const b of buildings) {
    if (capped.length >= 2200) break;
    let clash = false;
    for (const s of seen) {
      if (dist2(b.x, b.z, s.x, s.z) < 12 * 12) {
        clash = true;
        break;
      }
    }
    if (clash) continue;
    seen.push(b);
    capped.push(b);
  }
  return capped;
}

function clusterSpec(k, lat, lon, count, yaw, tallBias) {
  return { k, lat, lon, count, yaw, tallBias };
}

function generateCorridor(river, parks, existing) {
  const out = [];
  const blocked = existing.slice();
  const tooClose = (x, z, min) => blocked.some((b) => dist2(x, z, b.x, b.z) < min * min);
  let seed = 91;
  for (let i = 1; i < river.length - 1; i += 1) {
    const [x0, z0] = river[i - 1];
    const [x1, z1] = river[i + 1];
    const [x, z] = river[i];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    for (const side of [-1, 1]) {
      for (const row of [1, 2]) {
        seed += 1;
        if (hash(seed) < 0.18) continue;
        const dist = 150 + row * 95 + (hash(seed + 4) - 0.5) * 28;
        const px = x + nx * side * dist + (hash(seed + 6) - 0.5) * 24;
        const pz = z + nz * side * dist + (hash(seed + 8) - 0.5) * 24;
        if (onWater(px, pz, river) || inPark(px, pz, parks) || tooClose(px, pz, 18)) continue;
        const b = {
          x: round(px),
          z: round(pz),
          w: round(12 + hash(seed + 10) * 16),
          d: round(10 + hash(seed + 12) * 14),
          h: round(8 + hash(seed + 14) * 22),
          r: round(Math.atan2(nz, nx) + (side < 0 ? 0 : Math.PI / 2), 3),
          k: nearestDistrict(px, pz),
        };
        out.push(b);
        blocked.push(b);
      }
    }
  }
  return out;
}

function generateFabric(river, parks, existing) {
  const specs = [
    clusterSpec(1, 51.5054, -0.0235, 90, 0.05, 0.82),
    clusterSpec(2, 51.5256, -0.0774, 70, 0.4, 0.22),
    clusterSpec(3, 51.5257, -0.0875, 64, 0.35, 0.28),
    clusterSpec(4, 51.5312, -0.1238, 58, 0.1, 0.35),
    clusterSpec(5, 51.5136, -0.1357, 72, 0.55, 0.18),
    clusterSpec(6, 51.5064, -0.1162, 48, 0.2, 0.25),
    clusterSpec(7, 51.5436, -0.0234, 40, 0.3, 0.15),
    clusterSpec(8, 51.5175, -0.176, 50, 0.0, 0.3),
    clusterSpec(0, 51.5142, -0.089, 110, 0.15, 0.55),
    clusterSpec(0, 51.5012, -0.124, 40, 0.0, 0.2),
    clusterSpec(0, 51.509, -0.098, 36, 0.2, 0.22),
    clusterSpec(0, 51.515, -0.14, 40, 0.5, 0.16),
    clusterSpec(0, 51.5038, -0.086, 28, 0.1, 0.2),
    clusterSpec(0, 51.52, -0.1, 34, 0.25, 0.18),
  ];
  const out = [];
  let seed = 7;
  const blocked = existing.slice();

  const tooClose = (x, z, min) => {
    for (const b of blocked) {
      if (dist2(x, z, b.x, b.z) < min * min) return true;
    }
    return false;
  };

  for (const spec of specs) {
    const [cx, cz] = toXZ(spec.lat, spec.lon);
    const cols = Math.ceil(Math.sqrt(spec.count * 1.4));
    const rows = Math.ceil(spec.count / cols) + 2;
    const gapX = spec.k === 1 ? 38 : 28;
    const gapZ = spec.k === 1 ? 42 : 26;
    let placed = 0;
    for (let row = -rows; row <= rows && placed < spec.count; row += 1) {
      for (let col = -cols; col <= cols && placed < spec.count; col += 1) {
        seed += 1;
        if (hash(seed) < 0.22) continue;
        const jitterX = (hash(seed + 3) - 0.5) * 10;
        const jitterZ = (hash(seed + 9) - 0.5) * 10;
        const lx = col * gapX + jitterX;
        const lz = row * gapZ + jitterZ;
        const c = Math.cos(spec.yaw);
        const s = Math.sin(spec.yaw);
        const x = cx + lx * c - lz * s;
        const z = cz + lx * s + lz * c;
        if (onWater(x, z, river) || inPark(x, z, parks)) continue;
        if (tooClose(x, z, 16)) continue;
        const t = hash(seed + 11);
        const wide = 10 + hash(seed + 13) * (spec.k === 1 ? 28 : 18);
        const deep = 10 + hash(seed + 17) * (spec.k === 1 ? 24 : 16);
        let h;
        if (t < spec.tallBias) {
          h = 40 + hash(seed + 19) * (spec.k === 1 ? 180 : 90);
        } else {
          h = 9 + hash(seed + 21) * 24;
        }
        const b = {
          x: round(x),
          z: round(z),
          w: round(wide),
          d: round(deep),
          h: round(h),
          r: round(spec.yaw + (hash(seed + 23) - 0.5) * 0.08, 3),
          k: spec.k,
        };
        out.push(b);
        blocked.push(b);
        placed += 1;
      }
    }
  }
  return out;
}

const river = resampleSimple(
  THAMES_LONLAT.map(([lon, lat]) => toXZ(lat, lon)),
  60,
).map(([x, z]) => [round(x), round(z)]);

const parks = PARKS.map((park) => {
  const [x, z] = toXZ(park.lat, park.lon);
  return { x: round(x), z: round(z), w: park.w, d: park.d, r: park.r };
});

const docks = DOCKS.map((poly) => poly.map(([lat, lon]) => toXZ(lat, lon).map((n) => round(n))));

const landmarks = LANDMARKS.map((item) => {
  const [x, z] = toXZ(item.lat, item.lon);
  return { id: item.id, name: item.name, x: round(x), z: round(z), h: item.h, kind: item.kind };
});

const districts = DISTRICTS.map((d, i) => {
  const [x, z] = toXZ(d.lat, d.lon);
  return { id: d.id, name: d.name, x: round(x), z: round(z), k: i };
});

const osm = await fetchOsmBuildings();
const corridor = generateCorridor(river, parks, osm);
const fabric = generateFabric(river, parks, [...osm, ...corridor]);
const buildings = [...osm, ...corridor, ...fabric].filter((b) => {
  return !landmarks.some((item) => dist2(b.x, b.z, item.x, item.z) < 48 * 48);
});

const city = {
  origin: { lat: ORIGIN_LAT, lon: ORIGIN_LON },
  osmCount: osm.length,
  buildings,
  river,
  docks,
  parks,
  landmarks,
  districts,
};

const outPath = join(root, "src/generated/london-city.json");
writeFileSync(outPath, JSON.stringify(city));
console.log(
  `wrote ${outPath} buildings=${buildings.length} osm=${osm.length} fabric=${fabric.length} river=${river.length}`,
);
