#!/usr/bin/env node
/**
 * Drive the running gallery in Chrome. Fail if the cards or demos do not
 * actually respond. Writes public/proof/*.png.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const proof = join(root, "public/proof");
const base = process.env.PROVE_URL ?? "http://127.0.0.1:43127";

mkdirSync(proof, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

try {
  const home = await page.goto(base, { waitUntil: "networkidle" });
  assert(home && home.ok(), `home HTTP ${home?.status()}`);
  const title = await page.locator("h1").first().textContent();
  assert(title?.includes("One bookmark"), `home h1 was ${title}`);
  const cards = page.locator("a[href^='/demos/']");
  const cardCount = await cards.count();
  assert(cardCount >= 2, `expected at least 2 demo links, got ${cardCount}`);
  await page.screenshot({ path: join(proof, "gallery.png"), fullPage: true });

  await page.goto(`${base}/demos/isometric-london`, { waitUntil: "networkidle" });
  await page.locator("[data-hydrated='true']").waitFor();
  const map = page.locator("[data-testid='isometric-map']");
  assert((await map.count()) === 1, "isometric map missing");
  const startDistrict = await page.getByTestId("district-name").textContent();
  assert(startDistrict?.includes("Canary"), `default district ${startDistrict}`);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await map.locator("text=Shoreditch").click();
  const after = await page.getByTestId("district-name").textContent();
  assert(after?.includes("Shoreditch"), `expected Shoreditch after click, got ${after}`);
  await page.screenshot({ path: join(proof, "isometric-london.png"), fullPage: true });

  await page.goto(`${base}/demos/bookmark-agent-loop`, { waitUntil: "networkidle" });
  await page.locator("[data-hydrated='true']").waitFor();
  await page.getByTestId("run-morning").click();
  await page.getByTestId("loop-result").waitFor({ timeout: 12000 });
  await page.getByTestId("loop-phase").filter({ hasText: "Shipped" }).waitFor({ timeout: 12000 });
  const shipped = await page.getByTestId("loop-phase").textContent();
  assert(shipped?.includes("Shipped"), `expected shipped, got ${shipped}`);
  await page.screenshot({ path: join(proof, "bookmark-agent-loop.png"), fullPage: true });
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`proof screenshots written under ${proof}`);
