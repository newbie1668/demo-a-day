#!/usr/bin/env node
/**
 * Usage: node scripts/mark-built.mjs <bookmarkId> <slug>
 * Sets that queue item to built. Fails if the id is missing or already skipped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , bookmarkId, slug] = process.argv;

if (!bookmarkId || !slug) {
  console.error("usage: node scripts/mark-built.mjs <bookmarkId> <slug>");
  process.exit(1);
}

const queuePath = join(root, "data/queue.json");
const queue = JSON.parse(readFileSync(queuePath, "utf8"));
const item = queue.items.find((row) => row.id === bookmarkId);
if (!item) {
  console.error(`unknown bookmark id ${bookmarkId}`);
  process.exit(1);
}
if (item.status === "skipped") {
  console.error(`bookmark ${bookmarkId} is skipped: ${item.skipReason}`);
  process.exit(1);
}

item.status = "built";
item.slug = slug;
item.builtAt = new Date().toISOString();
writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
console.log(`marked ${bookmarkId} built as ${slug}`);
