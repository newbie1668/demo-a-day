"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type District = {
  id: string;
  name: string;
  q: number;
  r: number;
  color: string;
  startups: number;
  note: string;
};

const DISTRICTS: District[] = [
  {
    id: "canary",
    name: "Canary Wharf",
    q: 7,
    r: 3,
    color: "#e6b422",
    startups: 41,
    note: "Towers on the water. Foo's own thread argues this could be London's SF.",
  },
  {
    id: "shoreditch",
    name: "Shoreditch",
    q: 3,
    r: 1,
    color: "#e07050",
    startups: 63,
    note: "Roundabout gravity. Agencies and seed-stage density.",
  },
  {
    id: "old-street",
    name: "Old Street",
    q: 2,
    r: 2,
    color: "#c45c48",
    startups: 54,
    note: "Silicon Roundabout. Still the default for first desks.",
  },
  {
    id: "kings-cross",
    name: "King's Cross",
    q: 1,
    r: 0,
    color: "#5e9aaf",
    startups: 37,
    note: "Coal Drops, Google, and the knowledge-quarter pull north.",
  },
  {
    id: "soho",
    name: "Soho",
    q: 0,
    r: 2,
    color: "#d46a8c",
    startups: 28,
    note: "Media, AI film tools, and rooms that still take walk-ins.",
  },
  {
    id: "southbank",
    name: "South Bank",
    q: 1,
    r: 4,
    color: "#4f8c9c",
    startups: 22,
    note: "River-facing studios. Good for demos that want a skyline.",
  },
  {
    id: "hackney",
    name: "Hackney Wick",
    q: 5,
    r: 0,
    color: "#7eab55",
    startups: 19,
    note: "Yards and warehouses. Hardware and climate tucked behind the canal.",
  },
  {
    id: "paddington",
    name: "Paddington",
    q: -1,
    r: 1,
    color: "#8f7ab8",
    startups: 16,
    note: "Basin offices and the Elizabeth line. A quieter corporate edge.",
  },
];

const TILE_W = 88;
const TILE_H = 44;

function project(q: number, r: number, originX: number, originY: number, scale: number) {
  return {
    x: originX + ((q - r) * TILE_W * scale) / 2,
    y: originY + ((q + r) * TILE_H * scale) / 2,
  };
}

function diamondPath(x: number, y: number, scale: number): string {
  const w = (TILE_W * scale) / 2;
  const h = (TILE_H * scale) / 2;
  return `M ${x} ${y - h} L ${x + w} ${y} L ${x} ${y + h} L ${x - w} ${y} Z`;
}

export function IsometricLondon() {
  const [selectedId, setSelectedId] = useState("canary");
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 420, y: 150 });
  const [hydrated, setHydrated] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const selected = useMemo(
    () => DISTRICTS.find((district) => district.id === selectedId) ?? DISTRICTS[0],
    [selectedId],
  );

  const ground = useMemo(() => {
    const tiles = [];
    for (let q = -2; q <= 9; q += 1) {
      for (let r = -1; r <= 6; r += 1) {
        const p = project(q, r, origin.x, origin.y, scale);
        const river = r === 3 && q >= 0 && q <= 8;
        tiles.push({
          key: `${q}:${r}`,
          d: diamondPath(p.x, p.y, scale),
          fill: river ? "#355968" : "#2a241c",
        });
      }
    }
    return tiles;
  }, [origin, scale]);

  const places = useMemo(() => {
    return [...DISTRICTS]
      .sort((a, b) => a.q + a.r - (b.q + b.r))
      .map((district) => {
        const p = project(district.q, district.r, origin.x, origin.y, scale);
        return { ...district, ...p, d: diamondPath(p.x, p.y, scale) };
      });
  }, [origin, scale]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]" data-hydrated={hydrated ? "true" : "false"}>
      <div className="overflow-hidden rounded-xl bg-[#16120e] ring-1 ring-foreground/10">
        <svg
          viewBox="0 0 840 480"
          className="h-auto w-full touch-none"
          data-testid="isometric-map"
          role="img"
          aria-label="Isometric map of London startup districts"
          onPointerDown={(event) => {
            const svg = event.currentTarget;
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const local = pt.matrixTransform(ctm.inverse());
            let best: { id: string; d: number } | null = null;
            for (const place of places) {
              const dx = local.x - place.x;
              const dy = local.y - place.y;
              const dist = dx * dx + dy * dy;
              if (dist < (42 * scale) ** 2 && (!best || dist < best.d)) {
                best = { id: place.id, d: dist };
              }
            }
            if (best) {
              setSelectedId(best.id);
              return;
            }
            drag.current = { x: event.clientX, y: event.clientY, ox: origin.x, oy: origin.y };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setOrigin({
              x: drag.current.ox + (event.clientX - drag.current.x),
              y: drag.current.oy + (event.clientY - drag.current.y),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerLeave={() => {
            drag.current = null;
          }}
        >
          <rect width="840" height="480" fill="#16120e" />
          {ground.map((tile) => (
            <path key={tile.key} d={tile.d} fill={tile.fill} stroke="#0c0b0a" strokeWidth="1" />
          ))}
          {places.map((place) => (
            <g key={place.id}>
              <path
                d={place.d}
                fill={place.color}
                stroke={place.id === selectedId ? "#f4efe4" : "#0c0b0a"}
                strokeWidth={place.id === selectedId ? 3 : 1}
              />
              <text
                x={place.x}
                y={place.y + 4}
                textAnchor="middle"
                fill="#14110e"
                fontFamily="ui-monospace, monospace"
                fontSize={Math.max(10, 11 * scale)}
              >
                {place.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <aside className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-amber-200/80 uppercase">District</p>
        <h2 className="font-heading text-2xl" data-testid="district-name">
          {selected.name}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{selected.note}</p>
        <p className="font-mono text-sm text-amber-100">{selected.startups} mapped startups</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setScale((value) => Math.min(1.6, value + 0.1))}>
            Zoom in
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setScale((value) => Math.max(0.7, value - 0.1))}>
            Zoom out
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setScale(1);
              setOrigin({ x: 420, y: 150 });
              setSelectedId("canary");
            }}
          >
            Reset
          </Button>
        </div>
        <p className="text-[11px] leading-4 text-muted-foreground">
          Drag empty tiles to pan. Schematic layout, not OSM. No map API.
        </p>
      </aside>
    </div>
  );
}
