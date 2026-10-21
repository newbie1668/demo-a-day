#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const demos = JSON.parse(readFileSync(join(root, "src/generated/demos.json"), "utf8"));
const renders = readFileSync(join(root, "src/demos/renders.tsx"), "utf8");

let failed = false;
for (const demo of demos.demos) {
  const needle = `case "${demo.slug}":`;
  if (!renders.includes(needle)) {
    console.error(`demos.json slug ${demo.slug} is missing from src/demos/renders.tsx`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`registry covers ${demos.demos.length} gallery demos`);
