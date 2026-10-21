#!/usr/bin/env node
/**
 * Drive the running gallery in Chrome with SwiftShader WebGL. Fail if the
 * cards or demos do not respond, or if the London canvas is a flat clear.
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const proof = join(root, "public/proof");
const thumbs = join(root, "public/thumbs");
const artifacts = "/opt/cursor/artifacts";
const base = process.env.PROVE_URL ?? "http://127.0.0.1:43127";

mkdirSync(proof, { recursive: true });
mkdirSync(thumbs, { recursive: true });
mkdirSync(artifacts, { recursive: true });

const chromeArgs = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--use-gl=swiftshader",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
  args: chromeArgs,
});

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function canvasProbe(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-testid='isometric-map'] canvas, canvas");
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return { ok: false, reason: "no canvas" };
    if (canvas.width < 64 || canvas.height < 64) return { ok: false, reason: `canvas ${canvas.width}x${canvas.height}` };
    const w = 96;
    const h = 64;
    const probe = document.createElement("canvas");
    probe.width = w;
    probe.height = h;
    const ctx = probe.getContext("2d");
    if (!ctx) return { ok: false, reason: "no 2d" };
    ctx.drawImage(canvas, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let min = 255;
    let max = 0;
    let water = 0;
    const counts = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const v = r + g + b;
      if (v < min) min = v;
      if (v > max) max = v;
      const key = `${r >> 4}:${g >> 4}:${b >> 4}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (b > 48 && b > r * 1.05 && g > r * 0.72 && g > 30) water += 1;
    }
    const unique = counts.size;
    return {
      ok: max - min > 40 && unique > 8,
      min,
      max,
      unique,
      water,
      waterRatio: water / (w * h),
      width: canvas.width,
      height: canvas.height,
    };
  });
}

async function freezeWebGL(page) {
  await page.evaluate(() => {
    for (const canvas of document.querySelectorAll("canvas")) {
      if (!(canvas instanceof HTMLCanvasElement)) continue;
      try {
        const url = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.setAttribute("data-frozen-webgl", "true");
        img.style.display = "block";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        canvas.replaceWith(img);
      } catch {
        // SwiftShader can throw if the context is lost. Leave the canvas.
      }
    }
  });
}

async function shot(page, name) {
  let buf;
  try {
    buf = await page.screenshot({ fullPage: true, timeout: 45000 });
  } catch {
    buf = await page.screenshot({ fullPage: false, timeout: 15000 });
  }
  writeFileSync(join(proof, `${name}.png`), buf);
  try {
    writeFileSync(join(artifacts, `${name}.png`), buf);
  } catch (err) {
    console.warn(`could not write ${artifacts}/${name}.png`, err instanceof Error ? err.message : err);
  }
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const home = await desktop.goto(base, { waitUntil: "networkidle" });
  assert(home && home.ok(), `home HTTP ${home?.status()}`);
  await desktop.locator("h1").first().waitFor();
  const title = await desktop.locator("h1").first().textContent();
  assert(title?.includes("I ship one bookmark a day"), `home h1 was ${title}`);
  const cards = desktop.locator("a[href^='/demos/']");
  const cardCount = await cards.count();
  assert(cardCount >= 2, `expected at least 2 demo links, got ${cardCount}`);

  await desktop.goto(`${base}/demos/isometric-london`, { waitUntil: "networkidle" });
  await desktop.locator("[data-hydrated='true']").waitFor({ state: "attached", timeout: 40000 });
  await desktop.locator("[data-webgl='ready']").waitFor({ state: "attached", timeout: 40000 });
  await desktop.waitForTimeout(2800);
  const map = desktop.locator("[data-testid='isometric-map']");
  assert((await map.count()) === 1, "isometric map missing");
  const webgl = await canvasProbe(desktop);
  console.log("london canvas probe", webgl);
  assert(webgl.ok, `WebGL canvas looks blank ${JSON.stringify(webgl)}`);
  assert(webgl.water > 24, `Thames not visible in the frame ${JSON.stringify(webgl)}`);
  const startDistrict = await desktop.getByTestId("district-name").textContent();
  assert(startDistrict?.includes("Canary"), `default district ${startDistrict}`);
  const londonThumb = await desktop.locator("[data-testid='isometric-map'] canvas").screenshot();
  writeFileSync(join(thumbs, "isometric-london.png"), londonThumb);
  await freezeWebGL(desktop);
  await shot(desktop, "isometric-london-desktop");
  await desktop.screenshot({ path: join(proof, "isometric-london.png"), fullPage: true });

  await desktop.goto(`${base}/demos/isometric-london`, { waitUntil: "networkidle" });
  await desktop.locator("[data-webgl='ready']").waitFor({ state: "attached", timeout: 40000 });
  await desktop.getByRole("button", { name: "Zoom in" }).click();
  await desktop.getByRole("button", { name: "Shoreditch" }).click();
  const after = await desktop.getByTestId("district-name").textContent();
  assert(after?.includes("Shoreditch"), `expected Shoreditch after click, got ${after}`);
  await desktop.waitForTimeout(900);

  await desktop.goto(`${base}/demos/bookmark-agent-loop`, { waitUntil: "networkidle" });
  await desktop.locator("[data-hydrated='true']").waitFor({ state: "attached", timeout: 40000 });
  const loopThumb = await desktop.locator("[data-hydrated='true']").screenshot();
  writeFileSync(join(thumbs, "bookmark-agent-loop.png"), loopThumb);
  await desktop.getByTestId("run-morning").click();
  await desktop.getByTestId("loop-result").waitFor({ timeout: 20000 });
  await desktop.getByTestId("loop-phase").filter({ hasText: "Shipped" }).waitFor({ timeout: 20000 });
  const shipped = await desktop.getByTestId("loop-phase").textContent();
  assert(shipped?.includes("Shipped"), `expected shipped, got ${shipped}`);
  await shot(desktop, "bookmark-agent-loop-desktop");
  await desktop.screenshot({ path: join(proof, "bookmark-agent-loop.png"), fullPage: true });

  mkdirSync(join(root, "out/thumbs"), { recursive: true });
  copyFileSync(join(thumbs, "isometric-london.png"), join(root, "out/thumbs/isometric-london.png"));
  copyFileSync(join(thumbs, "bookmark-agent-loop.png"), join(root, "out/thumbs/bookmark-agent-loop.png"));

  const galleryPage = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await galleryPage.goto(base, { waitUntil: "domcontentloaded" });
  await galleryPage.locator("h1").first().waitFor({ state: "attached", timeout: 40000 });
  try {
    await galleryPage.locator("[data-hero-webgl] canvas").waitFor({ state: "attached", timeout: 20000 });
    await galleryPage.waitForTimeout(2400);
    await freezeWebGL(galleryPage);
  } catch {
    await galleryPage.waitForTimeout(800);
  }
  await shot(galleryPage, "gallery-desktop");
  await galleryPage.screenshot({ path: join(proof, "gallery.png"), fullPage: true });
  await galleryPage.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(`${base}/demos/isometric-london`, { waitUntil: "networkidle" });
  await mobile.locator("[data-hydrated='true']").waitFor({ state: "attached", timeout: 40000 });
  await mobile.locator("[data-webgl='ready']").waitFor({ state: "attached", timeout: 40000 });
  await mobile.waitForTimeout(2400);
  await freezeWebGL(mobile);
  await shot(mobile, "isometric-london-mobile");
  await mobile.getByRole("button", { name: "Soho" }).click();
  const soho = await mobile.getByTestId("district-name").textContent();
  assert(soho?.includes("Soho"), `expected Soho after tap, got ${soho}`);

  await mobile.goto(`${base}/demos/bookmark-agent-loop`, { waitUntil: "networkidle" });
  await mobile.locator("[data-hydrated='true']").waitFor({ state: "attached", timeout: 40000 });
  await mobile.getByTestId("run-morning").click();
  await mobile.getByTestId("loop-phase").filter({ hasText: "Shipped" }).waitFor({ timeout: 20000 });
  await shot(mobile, "bookmark-agent-loop-mobile");

  const mobileHome = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileHome.goto(base, { waitUntil: "domcontentloaded" });
  await mobileHome.locator("h1").first().waitFor({ state: "attached", timeout: 40000 });
  try {
    await mobileHome.locator("[data-hero-webgl] canvas").waitFor({ state: "attached", timeout: 20000 });
    await mobileHome.waitForTimeout(2200);
    await freezeWebGL(mobileHome);
  } catch {
    await mobileHome.waitForTimeout(800);
  }
  await shot(mobileHome, "gallery-mobile");
  await mobileHome.screenshot({ path: join(proof, "gallery-mobile.png"), fullPage: true });
  await mobileHome.close();

  await desktop.close();
  await mobile.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

for (const name of ["gallery", "isometric-london", "bookmark-agent-loop"]) {
  try {
    copyFileSync(join(artifacts, `${name}-desktop.png`), join(artifacts, `${name}.png`));
  } catch (err) {
    console.warn(`could not alias ${name}.png`, err instanceof Error ? err.message : err);
  }
}

console.log(`proof screenshots written under ${proof} and ${artifacts}`);
