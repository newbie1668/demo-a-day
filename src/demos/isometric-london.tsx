"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { DISTRICTS, DISTRICT_BY_ID, type DistrictId } from "@/lib/london-districts";
import { useHydrated } from "@/lib/use-hydrated";
import type { CameraPose, Mood, ZoomTick } from "@/demos/london-scene";

const LondonCanvas = dynamic(
  () => import("@/demos/london-scene").then((mod) => mod.LondonCanvas),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#0c1018]" />,
  },
);

function SceneShell({
  variant,
  selectedId,
  hoveredId,
  mood,
  pose,
  zoomTick,
  resetTick,
  onSelect,
  onHover,
  onReady,
}: {
  variant: "hero" | "demo";
  selectedId: DistrictId;
  hoveredId: DistrictId | null;
  mood: Mood;
  pose: CameraPose;
  zoomTick: ZoomTick | null;
  resetTick: number;
  onSelect: (id: DistrictId) => void;
  onHover: (id: DistrictId | null) => void;
  onReady: () => void;
}) {
  return (
    <LondonCanvas
      variant={variant}
      selectedId={selectedId}
      hoveredId={hoveredId}
      mood={mood}
      pose={pose}
      zoomTick={zoomTick}
      resetTick={resetTick}
      onSelect={onSelect}
      onHover={onHover}
      onReady={onReady}
    />
  );
}

export function LondonHero() {
  const [ready, setReady] = useState(false);
  return (
    <div className="webgl-stage absolute inset-0" data-hero-webgl={ready ? "ready" : "loading"}>
      <SceneShell
        variant="hero"
        selectedId="canary"
        hoveredId={null}
        mood="dusk"
        pose="vista"
        zoomTick={null}
        resetTick={0}
        onSelect={() => undefined}
        onHover={() => undefined}
        onReady={() => setReady(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0a0c] from-10% via-[#0b0a0c]/50 via-45% to-transparent to-78%" />
    </div>
  );
}

export function IsometricLondon() {
  const [selectedId, setSelectedId] = useState<DistrictId>("canary");
  const [hoveredId, setHoveredId] = useState<DistrictId | null>(null);
  const [mood, setMood] = useState<Mood>("dusk");
  const [pose, setPose] = useState<CameraPose>("vista");
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  const [zoomTick, setZoomTick] = useState<ZoomTick | null>(null);
  const [resetTick, setResetTick] = useState(0);

  const selected = DISTRICT_BY_ID[selectedId];
  const shownId = hoveredId ?? selectedId;
  const shown = DISTRICT_BY_ID[shownId];
  const sourceNote = "Drag to orbit. Click a district.";

  function selectDistrict(id: DistrictId) {
    setSelectedId(id);
    setPose("district");
  }

  return (
    <div
      className="space-y-4"
      data-hydrated={hydrated ? "true" : "false"}
      data-webgl={ready ? "ready" : "loading"}
    >
      <div
        className="webgl-stage relative overflow-hidden rounded-2xl bg-[#0c1018] ring-1 ring-white/10"
        data-testid="isometric-map"
      >
        <div className="h-[min(74vh,820px)] min-h-[420px] w-full">
          <SceneShell
            variant="demo"
            selectedId={selectedId}
            hoveredId={hoveredId}
            mood={mood}
            pose={pose}
            zoomTick={zoomTick}
            resetTick={resetTick}
            onSelect={selectDistrict}
            onHover={setHoveredId}
            onReady={() => setReady(true)}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-3 sm:p-4">
          <div className="pointer-events-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMood("dusk")}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                mood === "dusk"
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-black/45 text-foreground/90 ring-white/15 backdrop-blur-md hover:bg-black/60"
              }`}
            >
              Dusk
            </button>
            <button
              type="button"
              onClick={() => setMood("day")}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                mood === "day"
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-black/45 text-foreground/90 ring-white/15 backdrop-blur-md hover:bg-black/60"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              className="rounded-full bg-black/45 px-3 py-1.5 text-sm text-foreground/90 ring-1 ring-white/15 backdrop-blur-md hover:bg-black/60"
              onClick={() => setZoomTick({ dir: 1, n: Date.now() })}
            >
              Zoom in
            </button>
            <button
              type="button"
              className="rounded-full bg-black/45 px-3 py-1.5 text-sm text-foreground/90 ring-1 ring-white/15 backdrop-blur-md hover:bg-black/60"
              onClick={() => setZoomTick({ dir: -1, n: Date.now() })}
            >
              Zoom out
            </button>
            <button
              type="button"
              className="rounded-full bg-black/45 px-3 py-1.5 text-sm text-foreground/90 ring-1 ring-white/15 backdrop-blur-md hover:bg-black/60"
              onClick={() => {
                setSelectedId("canary");
                setPose("vista");
                setResetTick((n) => n + 1);
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <aside className="p-3 md:pointer-events-none md:absolute md:top-20 md:right-4 md:w-80 md:p-0">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-[#0c0b10]/88 p-5 shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[10px] tracking-[0.22em] text-amber-100/70 uppercase">District</p>
            <h2 className="mt-2 font-heading text-3xl tracking-tight text-foreground" data-testid="district-name">
              {shown.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground/75">{shown.note}</p>
            {hoveredId && hoveredId !== selected.id ? (
              <p className="mt-3 font-mono text-[11px] text-amber-100/80">Click to hold this view</p>
            ) : null}
          </div>
        </aside>
      </div>
      <div className="flex flex-wrap gap-2">
        {DISTRICTS.map((district) => {
          const active = district.id === selectedId && pose === "district";
          return (
            <button
              key={district.id}
              type="button"
              onClick={() => selectDistrict(district.id)}
              onMouseEnter={() => setHoveredId(district.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-foreground/80 ring-1 ring-white/10 hover:bg-white/10"
              }`}
            >
              {district.name}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{sourceNote}</p>
    </div>
  );
}
