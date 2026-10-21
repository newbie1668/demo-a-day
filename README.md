# Demo a Day

I turn one X bookmark into a working browser demo. Newest first.

I am [Foo Ming Li](https://x.com/fooming86) (`@fooming86`), a senior PM in London. I also build [London Startup Map](https://londonstartupmap.com).

## Run locally

You need Node 20.9+ and Python 3.

```bash
npm ci
python3 scripts/generate-queue.py
npm run dev
```

The Next.js dev server listens on [http://127.0.0.1:43127](http://127.0.0.1:43127).

To preview the Cloudflare static export (the same files `npm run deploy` uploads):

```bash
npm run build
npm start
```

`npm start` runs `wrangler dev` against `./out` on port 43127.

Rebake the London massing (Overpass, no API key) with:

```bash
node scripts/bake-london.mjs
```

## Bookmark queue

`data/raw/bookmarks.json` is the X dump (84 bookmarks). `scripts/generate-queue.py` writes `data/queue.json` with a summary, a demo-ability score (0–5), a suggested demo, and `pending` / `built` / `skipped`.

Image-only posts `2109809131918152075` and `2107874142897025212` are skipped, along with anything that needs a paid API or key.

```bash
npm run queue:pick
```

prints the next pending item (highest score, then newest).

## Build the next demo

Follow [`.cursor/skills/build-next-demo/SKILL.md`](.cursor/skills/build-next-demo/SKILL.md). The skill now has a visual quality checklist. Real desktop and mobile screenshots are required. The last step is `npm run deploy`.

## Deploy on Cloudflare Workers

The gallery is a Next.js static export (`output: "export"`) served as Workers static assets. Worker name: `demo-a-day`. There is no account id in the repo.

From a clean clone, with only `CLOUDFLARE_API_TOKEN` set (a token scoped to one account, with Workers edit permission):

```bash
npm ci && npm run deploy
```

That runs `next build` then `wrangler deploy`.

## Proof screenshots

With the export listening on port 43127 (`npm run build && npm start`), run `npm run prove` (needs local Chrome at `/usr/local/bin/google-chrome`, launched with SwiftShader). The script clicks through the gallery and both demos, checks the WebGL canvas is not blank, and writes `public/proof/` plus `/opt/cursor/artifacts/`.
