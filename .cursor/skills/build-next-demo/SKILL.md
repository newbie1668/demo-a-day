---
name: build-next-demo
description: Pick the highest-scoring pending X bookmark and ship it as a small browser demo on the Demo a Day gallery. Use when asked to build the next demo, ship today's demo, or run the daily bookmark-to-demo pipeline.
---

# Build the next demo

Ship one gallery demo from the bookmark queue. Keep it to an hour or two of agent work. No new paid APIs, keys, or services.

## Constraints

- Read bookmark text only from `data/raw/bookmarks.json` and `data/raw/expanded.json`. Do not invent posts.
- The demo must run in the browser with no backend secrets.
- Add no paid dependencies.
- One bookmark per run.

## Steps

1. From the repo root, run `python3 scripts/generate-queue.py`. It refreshes pending and skipped rows and leaves `status: built` rows alone.
2. Run `node scripts/pick-next-demo.mjs`. It prints the winner and writes `data/next.json`. Highest `demoAbility` wins. Ties go to the newer `createdAt`. Exit 2 means the queue is empty.
3. Read that JSON. Use `suggestedDemo` as the scope. Use `id`, `author`, and `sourceUrl` (`https://x.com/i/status/<id>`) on the gallery card. Do not swap in a different bookmark.
4. Choose a kebab-case `slug` from the idea. Create `src/demos/<slug>.tsx` as a client component with a real interaction (click, drag, toggle, or step). Keep it on one route.
5. Add a `case "<slug>":` arm in `src/demos/renders.tsx` that returns the new component.
6. Append an object to `src/generated/demos.json` with `slug`, `bookmarkId`, `title`, `pitch` (one line), `date` (today, `YYYY-MM-DD`), `thumbnail` (`/thumbs/<slug>.svg` or `.png`), `howBuilt`, `author`, and `sourceUrl`. The gallery lists the last appended demo first.
7. Add a thumbnail under `public/thumbs/`.
8. Run `node scripts/check-registry.mjs` then `npm run build`. The build must stay a static export (`output: "export"` in `next.config.ts`). Fix failures before you call it shipped. Do not add a server route, a Route Handler that reads the request, or anything else that would force `@opennextjs/cloudflare`.
9. Preview the export the same way Cloudflare will serve it: `npm start` (`wrangler dev` on port 43127). Open `/` and `/demos/<slug>` in a real browser. Click the main control. Save screenshots to `public/proof/gallery.png` and `public/proof/<slug>.png`. A green build is not proof.
10. Run `node scripts/mark-built.mjs <bookmarkId> <slug>`.
11. Run `python3 scripts/generate-queue.py` so `src/generated/queue-preview.json` sees the built row.
12. Commit the demo files, gallery entry, queue, thumbs, and proof screenshots. Push the working branch.
13. Run `npm run deploy` (`next build` then `wrangler deploy` to the `demo-a-day` Worker). Needs `CLOUDFLARE_API_TOKEN` in the environment. Do not hard-code an account id.

## Do not

- Skip image-only or paid-API rows. `generate-queue.py` already marked them `skipped`.
- Edit `scripts/generate-queue.py` scores unless the skip/ability was wrong, and say so in the commit.
- Add auth, a database, or a second component library.
- Import the demo render map from the home page.
- Add Vercel config, `vercel.json`, or a Vercel deploy path. This gallery ships on Cloudflare Workers only.
