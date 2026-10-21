#!/usr/bin/env node
/**
 * Print the highest-scoring pending queue item as JSON.
 * Tie-break: newer createdAt first. Exit 2 if the queue is empty of pending items.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const queuePath = join(root, "data/queue.json");
const nextPath = join(root, "data/next.json");

const queue = JSON.parse(readFileSync(queuePath, "utf8"));
const pending = queue.items.filter((item) => item.status === "pending");
pending.sort((a, b) => {
  if (b.demoAbility !== a.demoAbility) return b.demoAbility - a.demoAbility;
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
});

if (pending.length === 0) {
  console.error("no pending bookmarks left");
  process.exit(2);
}

const picked = pending[0];
writeFileSync(nextPath, JSON.stringify(picked, null, 2) + "\n");
process.stdout.write(JSON.stringify(picked, null, 2) + "\n");
