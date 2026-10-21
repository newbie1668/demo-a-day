#!/usr/bin/env python3
"""Build data/queue.json from the X bookmarks dump and the score table.

Summaries are taken from bookmark text (or expanded article title/body).
Scores and skip reasons are the only hand-authored fields. Regen is
idempotent for built items: a later run keeps slug and built status.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "bookmarks.json"
EXPANDED = ROOT / "data" / "raw" / "expanded.json"
QUEUE = ROOT / "data" / "queue.json"
SCORES_OUT = ROOT / "data" / "scores.json"
PREVIEW = ROOT / "src" / "generated" / "queue-preview.json"

# theme, demoAbility 0-5, skipReason (empty = not skipped), suggestedDemo
SCORES: dict[str, tuple[str, int, str, str]] = {
    "2112439926071693741": (
        "city-map",
        5,
        "",
        "Isometric pixel map of London districts with pan, zoom, and startup-cluster labels.",
    ),
    "2111339824867393931": (
        "agent",
        5,
        "",
        "Interactive morning loop: read the real bookmark queue, pick the top pending item, animate build/verify/ship.",
    ),
    "2110806173544812876": (
        "ai-in-software",
        0,
        "Needs a paid video model watching live footage.",
        "",
    ),
    "2102718297061929213": (
        "ai-video",
        0,
        "Needs paid Astra/Codex video editing.",
        "",
    ),
    "2102157001421906090": (
        "ai-video",
        0,
        "Needs paid Astra video editing on raw footage.",
        "",
    ),
    "2110778204873253046": (
        "ai-in-software",
        0,
        "Product launch that needs Neomatter's backend.",
        "",
    ),
    "2110764303087288788": (
        "ai-video",
        3,
        "",
        "Browser search over Openverse audio (free, no key) with a mock editor timeline.",
    ),
    "2110351202999587066": (
        "other",
        4,
        "",
        "Map of London pints with a short tasting note per pub, no live APIs.",
    ),
    "2109809131918152075": (
        "other",
        0,
        "Image-only. Meaning is not clear from the text.",
        "",
    ),
    "2109663899582878201": (
        "other",
        3,
        "",
        "Cookie-banner preset picker that writes a mock consent string into the page.",
    ),
    "2109298412361310228": (
        "career",
        3,
        "",
        "Clickable timeline of projects that moved a PM into applied AI.",
    ),
    "2107811879036792845": (
        "city-map",
        4,
        "",
        "Small 3D-ish map clone of one London slice with orbit and labelled blocks.",
    ),
    "2107874142897025212": (
        "other",
        0,
        "Image-only Coutiq/Decision API clip. Meaning is not clear from the text.",
        "",
    ),
    "2107535610672201876": (
        "city-map",
        0,
        "React Native / Apple Maps package, not a browser demo.",
        "",
    ),
    "2107102263051235698": (
        "other",
        0,
        "Cloudflare announcement list, not a self-contained demo.",
        "",
    ),
    "2106473272397492474": (
        "city-map",
        3,
        "",
        "Immersive Lombard-style street you can zoom into, drawn as a London hill.",
    ),
    "2106535398990377126": (
        "city-map",
        4,
        "",
        "Tiny three.js London block with fake traffic lights and a day/night toggle.",
    ),
    "2106685764402876561": (
        "ai-in-software",
        4,
        "",
        "Late truck on a London map. One click approves an agent reroute and rolls the ETA back.",
    ),
    "2106579541095481774": (
        "city-map",
        3,
        "",
        "Switchable boroughs (Shoreditch, Canary Wharf, King's Cross) in a reduced city viewer.",
    ),
    "2086495645742080049": (
        "city-map",
        5,
        "",
        "Total War-style campaign map of London startup districts competing on funding and talent.",
    ),
    "2106426962738880879": (
        "other",
        4,
        "",
        "Isometric warehouse as a strategy board. Drag pallets, watch the agent restack.",
    ),
    "2105721434807083061": (
        "agent",
        0,
        "Needs Claude Code plugins running locally.",
        "",
    ),
    "2105756563302723721": (
        "agent",
        0,
        "Needs Claude Code mods running locally.",
        "",
    ),
    "2105736661921656997": (
        "ai-in-software",
        0,
        "Needs the paid Jev decision model.",
        "",
    ),
    "2103668051468300701": (
        "agent",
        0,
        "Slack multi-player harness. Needs Slack tokens.",
        "",
    ),
    "2102796986256883868": (
        "ai-in-software",
        4,
        "",
        "Paste an X mention. Classify bug vs request vs praise, de-dupe against a mock Linear board, draft a reply.",
    ),
    "2102718343790641484": (
        "ai-video",
        0,
        "DaVinci/Astra editing prompt. Needs paid video tools.",
        "",
    ),
    "2102417868134797634": (
        "ai-video",
        0,
        "Needs paid AI video generation.",
        "",
    ),
    "2102050467505430555": (
        "agent",
        3,
        "",
        "Fake PR factory dashboard: a night of agent PRs landing on a London compile board.",
    ),
    "2084069099412611156": (
        "city-map",
        4,
        "",
        "Ghibli-tinted walk around London districts with two scripted tours.",
    ),
    "2102005817507479969": (
        "other",
        0,
        "Unified DM inbox needs LinkedIn, Slack, WhatsApp, and iMessage APIs.",
        "",
    ),
    "2101764502349906342": (
        "career",
        4,
        "",
        "Walkable three.js career world whose buildings are roles and side projects.",
    ),
    "2101599791541301460": (
        "ai-in-software",
        2,
        "",
        "Notes pane that shows a private on-device paste pipeline with fake entities.",
    ),
    "2101476399488160013": (
        "ai-in-software",
        4,
        "",
        "Smart paste: clipboard history plus the focused field pick the value to insert.",
    ),
    "2101520932519153854": (
        "ai-in-software",
        3,
        "",
        "Clipboard history drawer that ranks past copies against the current input.",
    ),
    "2100973868324417852": (
        "ai-in-software",
        3,
        "",
        "Rules-based tax document sorter on a handful of mock PDFs. No LLM.",
    ),
    "2100925069765534024": (
        "ai-in-software",
        0,
        "Needs the paid Jev decision model.",
        "",
    ),
    "2100178927528595912": (
        "other",
        0,
        "Cloudflare platform guide, not a self-contained demo.",
        "",
    ),
    "2098797241628758421": (
        "city-map",
        3,
        "",
        "Detail-pass loop: a London scene that gets sharper each time you hit refine.",
    ),
    "2098813973714149757": (
        "career",
        0,
        "Essay. No browser mechanic to demo.",
        "",
    ),
    "2098009222302540086": (
        "career",
        0,
        "Essay. No browser mechanic to demo.",
        "",
    ),
    "2097394663200076189": (
        "career",
        3,
        "",
        "A now page for a London PM, dated entries you can add in the browser.",
    ),
    "2086049629758480637": (
        "career",
        4,
        "",
        "Interactive case for Canary Wharf as London's SF, with district stats you can toggle.",
    ),
    "2096143589151756638": (
        "city-map",
        3,
        "",
        "Fly and walk a reduced London with a day/night switch, Hangzhou-post style.",
    ),
    "2095911316280025472": (
        "city-map",
        0,
        "Needs a terrain/buildings export API to make a print file.",
        "",
    ),
    "2095819818176029007": (
        "career",
        0,
        "Intro tweet. No demo mechanic.",
        "",
    ),
    "2095505027536224349": (
        "career",
        3,
        "",
        "Workshop landing for a 3-hour London PM session on shipping with agents.",
    ),
    "2094808120270918022": (
        "career",
        3,
        "",
        "Non-technical GitHub that still looks hired: a mock contribution wall of shipped demos.",
    ),
    "2094054951576387649": (
        "city-map",
        0,
        "MapLibre FlutterGPU. Not a browser demo.",
        "",
    ),
    "2094042779081207913": (
        "other",
        0,
        "Grok Bot credit grab. Not a demo, and it needs an X developer account.",
        "",
    ),
    "2093638857665192087": (
        "agent",
        0,
        "Needs an iOS app, webhook, and push certs.",
        "",
    ),
    "2093106777491640669": (
        "city-map",
        0,
        "Native Metal/Vulkan map engine, not a small browser demo.",
        "",
    ),
    "2093307842958970891": (
        "career",
        0,
        "Needs a paid p0 API key and email access.",
        "",
    ),
    "2092645833388789790": (
        "career",
        0,
        "Hiring tweet. No demo mechanic.",
        "",
    ),
    "2090527548157669715": (
        "city-map",
        5,
        "",
        "SimLondon: mock TfL, weather, and synthetic founders walking between startup sites.",
    ),
    "2087289803964559746": (
        "agent",
        0,
        "Open-source Grok Bot clone needs VMs, computer-use, and plugin credentials.",
        "",
    ),
    "2087071144939786398": (
        "city-map",
        0,
        "Needs Cesium 3D Tiles. Too heavy for a one-session demo.",
        "",
    ),
    "2086883206301925800": (
        "other",
        2,
        "",
        "Vibe-design checklist that scores a pasted URL against a short rubric.",
    ),
    "2086611202671583280": (
        "ai-video",
        0,
        "Needs a paid realtime video model.",
        "",
    ),
    "2086023649526452265": (
        "city-map",
        3,
        "",
        "Scroll-linked 3D section walker, reduced to one London street.",
    ),
    "2085765403729653877": (
        "city-map",
        3,
        "",
        "Replace a hero video with a tiny 3D scroll scene.",
    ),
    "2080671620272885819": (
        "other",
        0,
        "Product ad. No demo mechanic.",
        "",
    ),
    "2078266436468748558": (
        "other",
        2,
        "",
        "Slide deck that embeds a live mini-widget per slide.",
    ),
    "2075188252877672732": (
        "other",
        2,
        "",
        "Apple-design rubric you can run against a screenshot of this gallery.",
    ),
    "2074875092090470469": (
        "agent",
        2,
        "",
        "Orchestrator diagram: Fable plans, Codex executes, token meters stay fake.",
    ),
    "2041875179392135559": (
        "other",
        0,
        "Local GPU fine-tune. Needs hardware and model weights.",
        "",
    ),
    "2074512552013582592": (
        "agent",
        2,
        "",
        "Browsable skill shelf with a couple of fake web-design skills.",
    ),
    "2072436501263339841": (
        "agent",
        3,
        "",
        "Role board: orchestrator, reasoner, mechanic, peer reviewer. Drag a task through them.",
    ),
    "2071981082594210054": (
        "other",
        0,
        "Needs an NVIDIA API key.",
        "",
    ),
    "2070519891157799283": (
        "agent",
        4,
        "",
        "Overnight vault: a star map of notes with XP and a morning brief, all mock data.",
    ),
    "2070219094255599645": (
        "other",
        0,
        "Internal Anthropic video. No browser mechanic.",
        "",
    ),
    "2069967490575192401": (
        "other",
        0,
        "Design-workflow video. No browser mechanic.",
        "",
    ),
    "2069588907801424263": (
        "other",
        0,
        "Needs Unreal Engine MCP.",
        "",
    ),
    "2069075880912027687": (
        "agent",
        0,
        "Always-on Telegram agent. Needs a bot token.",
        "",
    ),
    "2069064659613958348": (
        "agent",
        2,
        "",
        "Clip metadata inspector: a fake recording with chapters an agent can read.",
    ),
    "2068753952850546985": (
        "agent",
        3,
        "",
        "Second-brain folder: drop a source card, watch a note graph grow.",
    ),
    "2068500722577219586": (
        "city-map",
        4,
        "",
        "Thames boats, a ribbon of fog, and fake flights into LHR/LCY on a 2.5D map.",
    ),
    "1898566138352820561": (
        "career",
        3,
        "",
        "One-pager that turns a target company into a teardown, mini PRD, and clickable prototype frame.",
    ),
    "2066664675542999369": (
        "career",
        0,
        "Viral-launch essay. No browser mechanic.",
        "",
    ),
    "2066437136354545981": (
        "agent",
        0,
        "Needs Kimi plus an Obsidian vault running overnight.",
        "",
    ),
    "2065035615800864954": (
        "agent",
        4,
        "",
        "Loss-function distiller: write a product in one field, watch a scorecard of losses update.",
    ),
    "2063321324605280569": (
        "agent",
        2,
        "",
        "Briefing console: type what you want in plain words, see a fake agent plan.",
    ),
    "2062774920770473990": (
        "career",
        0,
        "Codex giveaway post. No demo mechanic.",
        "",
    ),
    "2049499354323399002": (
        "agent",
        0,
        "Claude Code 24/7 team. Needs Claude Code and repo credentials.",
        "",
    ),
}


def collapse(text: str) -> str:
    return " ".join(text.split())


def summary_from(bookmark: dict, expanded: dict[str, dict]) -> str:
    title = bookmark.get("article_title")
    if isinstance(title, dict) and title.get("title"):
        head = str(title["title"]).strip()
    else:
        head = ""
    body = collapse(bookmark.get("text") or "")
    extra = expanded.get(bookmark["id"])
    if extra:
        art = extra.get("article") or {}
        plain = collapse(art.get("plain_text") or "")
        art_title = extra.get("article_title")
        if isinstance(art_title, dict):
            art_title = art_title.get("title") or ""
        if not head and art_title:
            head = str(art_title)
        if plain and (not body or body.startswith("http")):
            body = plain
    if head and body and not body.startswith(head):
        joined = f"{head}. {body}"
    else:
        joined = head or body
    if len(joined) > 220:
        joined = joined[:217].rstrip() + "..."
    return joined


def status_url(bookmark_id: str) -> str:
    return f"https://x.com/i/status/{bookmark_id}"


def main() -> int:
    raw = json.loads(RAW.read_text())
    bookmarks = raw["data"]
    users = {u["id"]: u["username"] for u in raw["includes"]["users"]}
    names = {u["id"]: u["name"] for u in raw["includes"]["users"]}

    expanded_list = json.loads(EXPANDED.read_text())["data"]
    expanded = {row["id"]: row for row in expanded_list}

    ids = [b["id"] for b in bookmarks]
    score_ids = set(SCORES)
    missing = [i for i in ids if i not in score_ids]
    extra = sorted(score_ids - set(ids))
    if missing or extra:
        print("score table does not match bookmarks.json", file=sys.stderr)
        if missing:
            print("missing", missing, file=sys.stderr)
        if extra:
            print("extra", extra, file=sys.stderr)
        return 1

    previous: dict[str, dict] = {}
    if QUEUE.exists():
        prev = json.loads(QUEUE.read_text())
        previous = {item["id"]: item for item in prev.get("items", [])}

    items = []
    for bookmark in bookmarks:
        bookmark_id = bookmark["id"]
        theme, ability, skip_reason, suggested = SCORES[bookmark_id]
        author = users.get(bookmark["author_id"], bookmark["author_id"])
        author_name = names.get(bookmark["author_id"], author)
        item = {
            "id": bookmark_id,
            "author": author,
            "authorName": author_name,
            "createdAt": bookmark["created_at"],
            "sourceUrl": status_url(bookmark_id),
            "theme": theme,
            "demoAbility": ability,
            "summary": summary_from(bookmark, expanded),
            "suggestedDemo": suggested or None,
            "skipReason": skip_reason or None,
        }
        prior = previous.get(bookmark_id)
        if prior and prior.get("status") == "built" and prior.get("slug"):
            item["status"] = "built"
            item["slug"] = prior["slug"]
            item["builtAt"] = prior.get("builtAt")
        elif skip_reason:
            item["status"] = "skipped"
        else:
            item["status"] = "pending"
        items.append(item)

    QUEUE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedFrom": "data/raw/bookmarks.json",
        "count": len(items),
        "items": items,
    }
    QUEUE.write_text(json.dumps(payload, indent=2) + "\n")

    scores_dump = {
        bookmark_id: {
            "theme": theme,
            "demoAbility": ability,
            "skipReason": skip_reason or None,
            "suggestedDemo": suggested or None,
        }
        for bookmark_id, (theme, ability, skip_reason, suggested) in SCORES.items()
    }
    SCORES_OUT.write_text(json.dumps(scores_dump, indent=2) + "\n")

    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview_items = [
        {
            "id": item["id"],
            "author": item["author"],
            "summary": item["summary"],
            "demoAbility": item["demoAbility"],
            "suggestedDemo": item["suggestedDemo"],
            "status": item["status"],
            "createdAt": item["createdAt"],
            "sourceUrl": item["sourceUrl"],
        }
        for item in items
    ]
    PREVIEW.write_text(json.dumps({"items": preview_items}, indent=2) + "\n")

    pending = sum(1 for i in items if i["status"] == "pending")
    built = sum(1 for i in items if i["status"] == "built")
    skipped = sum(1 for i in items if i["status"] == "skipped")
    print(f"wrote {QUEUE} ({len(items)} items, {pending} pending, {built} built, {skipped} skipped)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
