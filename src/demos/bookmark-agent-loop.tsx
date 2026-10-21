"use client";

import { useEffect, useMemo, useState } from "react";
import preview from "@/generated/queue-preview.json";

type PreviewItem = (typeof preview.items)[number];

type Phase =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "scoring" }
  | { kind: "picking"; item: PreviewItem }
  | { kind: "building"; item: PreviewItem; step: number }
  | { kind: "verifying"; item: PreviewItem }
  | { kind: "shipped"; item: PreviewItem };

const BUILD_STEPS = ["scaffold route", "draw the mechanic", "write the how-it-was-built note"] as const;

function pickHighest(items: PreviewItem[]): PreviewItem {
  const pending = items.filter((item) => item.status === "pending");
  pending.sort((a, b) => {
    if (b.demoAbility !== a.demoAbility) return b.demoAbility - a.demoAbility;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
  const first = pending[0];
  if (!first) {
    throw new Error("queue-preview has no pending items");
  }
  return first;
}

function nextPhase(phase: Phase, items: PreviewItem[]): Phase | null {
  switch (phase.kind) {
    case "idle":
    case "shipped":
      return null;
    case "reading":
      return { kind: "scoring" };
    case "scoring":
      return { kind: "picking", item: pickHighest(items) };
    case "picking":
      return { kind: "building", item: phase.item, step: 0 };
    case "building":
      if (phase.step + 1 < BUILD_STEPS.length) {
        return { kind: "building", item: phase.item, step: phase.step + 1 };
      }
      return { kind: "verifying", item: phase.item };
    case "verifying":
      return { kind: "shipped", item: phase.item };
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

function phaseDelay(phase: Phase): number {
  switch (phase.kind) {
    case "idle":
    case "shipped":
      return 0;
    case "reading":
      return 700;
    case "scoring":
      return 800;
    case "picking":
      return 700;
    case "building":
      return 650;
    case "verifying":
      return 900;
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

function phaseLabel(phase: Phase): string {
  switch (phase.kind) {
    case "idle":
      return "Waiting for morning";
    case "reading":
      return "Reading bookmarks.json";
    case "scoring":
      return "Scoring demo-ability";
    case "picking":
      return `Picked @${phase.item.author}`;
    case "building":
      return `Building · ${BUILD_STEPS[phase.step]}`;
    case "verifying":
      return "Checking in a real browser";
    case "shipped":
      return "Shipped to the gallery";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function BookmarkAgentLoop() {
  const items = preview.items;
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const ranked = useMemo(() => {
    return items
      .filter((item) => item.status === "pending")
      .slice()
      .sort((a, b) => {
        if (b.demoAbility !== a.demoAbility) return b.demoAbility - a.demoAbility;
        return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
      })
      .slice(0, 8);
  }, [items]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const upcoming = nextPhase(phase, items);
    if (!upcoming) return;
    const timer = window.setTimeout(() => setPhase(upcoming), phaseDelay(phase));
    return () => window.clearTimeout(timer);
  }, [items, phase]);

  const pickedId = phase.kind === "idle" || phase.kind === "reading" || phase.kind === "scoring" ? null : phase.item.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]" data-hydrated={hydrated ? "true" : "false"}>
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.2em] text-amber-200/80 uppercase">Pending queue</p>
          <p className="font-mono text-xs text-muted-foreground" data-testid="loop-phase">
            {phaseLabel(phase)}
          </p>
        </div>
        <ol className="space-y-2">
          {ranked.map((item, index) => {
            const active = item.id === pickedId;
            return (
              <li
                key={item.id}
                className={`rounded-lg px-3 py-2 ring-1 ${
                  active ? "bg-amber-200/10 ring-amber-200/40" : "ring-foreground/8"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                  <span className="text-amber-200">
                    {item.demoAbility}/5 · @{item.author}
                  </span>
                  <span className="text-muted-foreground">#{index + 1}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-foreground">{item.suggestedDemo}</p>
              </li>
            );
          })}
        </ol>
      </div>
      <aside className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Morning loop</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Same picker the daily agent uses: highest demo-ability, then newest bookmark. The list is the live
          queue, not invented cards.
        </p>
        <button
          type="button"
          data-testid="run-morning"
          className="h-8 rounded-lg bg-primary px-3 font-medium text-primary-foreground disabled:opacity-50"
          disabled={!hydrated || (phase.kind !== "idle" && phase.kind !== "shipped")}
          onClick={() => setPhase({ kind: "reading" })}
        >
          {phase.kind === "shipped" ? "Run again" : "Run this morning"}
        </button>
        {phase.kind === "building" || phase.kind === "verifying" || phase.kind === "shipped" ? (
          <div className="rounded-lg bg-zinc-950 p-3 text-sm" data-testid="loop-result">
            <p className="font-mono text-[11px] text-amber-200">@{phase.item.author}</p>
            <p className="mt-1 font-heading text-lg">{phase.item.suggestedDemo}</p>
            {phase.kind === "shipped" ? (
              <p className="mt-2 text-xs text-muted-foreground">Browser check passed. Card would land on /.</p>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
