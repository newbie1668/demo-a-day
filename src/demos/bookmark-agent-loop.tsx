"use client";

import { useEffect, useMemo, useState } from "react";
import preview from "@/generated/queue-preview.json";
import { useHydrated } from "@/lib/use-hydrated";

type PreviewItem = (typeof preview.items)[number];

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; index: number }
  | { kind: "scoring" }
  | { kind: "picking"; item: PreviewItem }
  | { kind: "building"; item: PreviewItem; step: number }
  | { kind: "verifying"; item: PreviewItem }
  | { kind: "shipped"; item: PreviewItem };

const BUILD_STEPS = ["scaffold the route", "draw the mechanic", "write the note on how it was built"] as const;

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
      if (phase.index + 1 < Math.min(8, items.filter((item) => item.status === "pending").length)) {
        return { kind: "reading", index: phase.index + 1 };
      }
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
      return 560;
    case "scoring":
      return 900;
    case "picking":
      return 850;
    case "building":
      return 720;
    case "verifying":
      return 1000;
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
      return "Reading the live queue";
    case "scoring":
      return "Ranking what I can ship today";
    case "picking":
      return `Picked @${phase.item.author}`;
    case "building":
      return `Building · ${BUILD_STEPS[phase.step]}`;
    case "verifying":
      return "Checking it in a browser";
    case "shipped":
      return "Shipped";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

function excerpt(text: string, max = 168): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" "));
  return `${cut.slice(0, at > 40 ? at : max).replace(/[.,\s]+$/, "")}.`;
}

function traceLines(phase: Phase, queueSize: number): string[] {
  switch (phase.kind) {
    case "idle":
      return [`${queueSize} pending bookmarks.`, "What I can ship today, then the newest.", "Press run when you want the morning."];
    case "reading":
      return ["Opening the queue I actually saved.", "Skipping image-only posts and anything that needs a paid API.", `Reading card ${phase.index + 1}.`];
    case "scoring":
      return ["A five has to work in the browser, today, with no keys.", "Newest bookmark breaks a tie."];
    case "picking":
      return [`Winner @${phase.item.author}.`, phase.item.suggestedDemo ?? "Build the mechanic."];
    case "building":
      return ["Scaffold the route.", "Draw the thing you can click.", "Keep the source bookmark on the card"].slice(
        0,
        phase.step + 1,
      );
    case "verifying":
      return ["Open it in Chrome.", "Click the main control.", "If it is blank, it is not shipped."];
    case "shipped":
      return ["Browser check passed.", "This is the card that would land on the gallery."];
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function BookmarkAgentLoop() {
  const items = preview.items;
  const hydrated = useHydrated();
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
    const upcoming = nextPhase(phase, items);
    if (!upcoming) return;
    const timer = window.setTimeout(() => setPhase(upcoming), phaseDelay(phase));
    return () => window.clearTimeout(timer);
  }, [items, phase]);

  const pickedId =
    phase.kind === "idle" || phase.kind === "reading" || phase.kind === "scoring" ? null : phase.item.id;
  const readingIndex = phase.kind === "reading" ? phase.index : -1;
  const running = phase.kind !== "idle" && phase.kind !== "shipped";
  const traces = traceLines(phase, ranked.length);
  const readingItem = phase.kind === "reading" ? ranked[phase.index] : null;
  const resultItem =
    phase.kind === "picking" ||
    phase.kind === "building" ||
    phase.kind === "verifying" ||
    phase.kind === "shipped"
      ? phase.item
      : null;
  const focusItem = resultItem ?? readingItem;
  const timeline: Array<{ id: Phase["kind"]; label: string }> = [
    { id: "reading", label: "Read" },
    { id: "scoring", label: "Rank" },
    { id: "picking", label: "Pick" },
    { id: "building", label: "Build" },
    { id: "verifying", label: "Check" },
    { id: "shipped", label: "Ship" },
  ];
  const timelineIndex = timeline.findIndex((step) => {
    if (phase.kind === "idle") return false;
    if (phase.kind === "reading") return step.id === "reading";
    return step.id === phase.kind;
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-[#0c0b10] ring-1 ring-white/10" data-hydrated={hydrated ? "true" : "false"}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.24em] text-amber-100/70 uppercase">Morning agent</p>
          <p className="font-heading text-xl tracking-tight">Live queue</p>
        </div>
        <p className="font-mono text-xs text-amber-100/85" data-testid="loop-phase">
          {phaseLabel(phase)}
        </p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
        <ol className="relative space-y-2 p-4 sm:p-5">
          {phase.kind === "reading" ? <div className="loop-scan" /> : null}
          {ranked.map((item, index) => {
            const active = item.id === pickedId || index === readingIndex;
            const dim = pickedId !== null && item.id !== pickedId;
            return (
              <li
                key={item.id}
                className={`rounded-xl px-3 py-3 ring-1 transition duration-500 ${
                  active
                    ? "bg-amber-200/10 ring-amber-200/45"
                    : dim
                      ? "scale-[0.99] opacity-40 ring-white/6"
                      : "ring-white/8"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                  <span className="text-amber-200">
                    {item.demoAbility}/5 · @{item.author}
                  </span>
                  <span className="text-muted-foreground">#{index + 1}</span>
                </div>
                <p className="mt-1.5 text-sm leading-5 text-foreground">{item.suggestedDemo}</p>
              </li>
            );
          })}
        </ol>
        <aside className="flex flex-col gap-4 border-t border-white/8 p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div>
            <h2 className="font-heading text-3xl tracking-tight">Morning loop</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Same picker I run each morning. What I can ship today, then the newest bookmark. The list is the live
              queue.
            </p>
          </div>
          <ol className="min-h-28 space-y-2 font-mono text-[12px] leading-5 text-amber-100/90">
            {traces.map((line) => (
              <li key={line} className="loop-line">
                <span className="mr-2 text-amber-200/50">›</span>
                {line}
              </li>
            ))}
          </ol>
          <button
            type="button"
            data-testid="run-morning"
            className="h-11 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            disabled={!hydrated || running}
            onClick={() => setPhase({ kind: "reading", index: 0 })}
          >
            {phase.kind === "shipped" ? "Run again" : running ? "Running…" : "Run this morning"}
          </button>
          {focusItem ? (
            <div
              className={`rounded-xl bg-black/40 p-4 ring-1 ${
                phase.kind === "shipped" ? "ring-amber-200/40" : "ring-white/12"
              }`}
              data-testid={resultItem ? "loop-result" : undefined}
            >
              <p className="font-mono text-[11px] text-amber-200">@{focusItem.author}</p>
              <p className="mt-1 font-heading text-2xl tracking-tight">{focusItem.suggestedDemo}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/70">{excerpt(focusItem.summary)}</p>
              {phase.kind === "shipped" ? (
                <p className="mt-3 font-mono text-[11px] tracking-[0.18em] text-amber-100 uppercase">Shipped</p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
      <div className="grid grid-cols-6 gap-1 border-t border-white/8 px-4 py-3 sm:px-5">
        {timeline.map((step, index) => {
          const done = timelineIndex >= index && phase.kind !== "idle";
          const current = timelineIndex === index;
          return (
            <div key={step.id} className="min-w-0">
              <div className={`h-1 rounded-full ${done ? "bg-amber-200" : "bg-white/10"} ${current ? "animate-pulse" : ""}`} />
              <p className={`mt-2 truncate font-mono text-[10px] ${done ? "text-amber-100" : "text-muted-foreground"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
