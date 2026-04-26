#!/usr/bin/env tsx
/**
 * Weekly editorial pass.
 *
 * Reads data/tools.live.json and the catalog. For the top 40 trending tools
 * passes raw signals + recent HN/Reddit headlines to Claude Haiku 4.5,
 * which:
 *   1) writes a one-sentence "why it's trending" blurb,
 *   2) adjusts trending by ±6 points based on hype-vs-substance judgement,
 *   3) flags any tools that look like noise (overcounted by string match).
 *
 * Output: data/editorial.json — merged into the site at build time.
 *
 * Cost: ~$0.50 per run with prompt caching, ~$2/month total.
 *
 * Required env:
 *   ANTHROPIC_API_KEY
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { CATALOG } from "../lib/catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const NOW_ISO = new Date().toISOString();
const SIX_MONTHS_AGO = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 6);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY. Skipping editorial rerank.");
  process.exit(0);
}

const client = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

type LiveEntry = {
  id: string;
  trending: number;
  growthMoM: number;
  liveSignals?: {
    hnMentions?: number;
    hnPoints?: number;
    redditMentions?: number;
    redditScore?: number;
    wikiViews30d?: number;
    githubStars?: number;
  };
};

type LiveDoc = { generatedAt: string; tools: LiveEntry[] };

async function fetchHNTitles(query: string, n = 5): Promise<string[]> {
  const since = Math.floor(SIX_MONTHS_AGO.getTime() / 1000);
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=${n}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "aindex-editorial" } });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.hits ?? []).map((h: { title: string }) => h.title).filter(Boolean).slice(0, n);
  } catch {
    return [];
  }
}

async function fetchRedditTitles(query: string, n = 5): Promise<string[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&t=month&limit=${n}&sort=top`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "aindex-editorial/1.0" } });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.data?.children ?? [])
      .map((p: { data: { title: string } }) => p.data.title)
      .filter(Boolean)
      .slice(0, n);
  } catch {
    return [];
  }
}

type EditorialOutput = {
  id: string;
  blurb: string;
  adjustment: number;   // -6 to +6
  noise: boolean;       // true if string-match seems off-topic
};

const SYSTEM = `You are AIndex's senior editor. Your job is to read a tool's raw public signals (HN mentions, Reddit posts, Wikipedia views, GitHub stars) and the headlines that drove them, then judge:

1. Is the buzz real adoption or noise (false-positive string matches, hype without substance)?
2. Why is this tool trending in one tight sentence — concrete, no marketing fluff.
3. A small numeric adjustment (-6 to +6) to the algorithmic trending score reflecting your editorial judgement vs the raw signal.

Write blurbs in the voice of a wry trade publication: terse, specific, factual. Prefer concrete observations ("powering ad creative at three Fortune 500 brands", "absorbed by ServiceNow") over generic ones ("popular with users").

Output JSON only.`;

async function rerank(
  tool: { id: string; name: string; vendor: string; blurb: string },
  signals: LiveEntry["liveSignals"],
  hn: string[],
  reddit: string[]
): Promise<EditorialOutput | null> {
  const prompt = `Tool: ${tool.name} (${tool.vendor})
Existing blurb: ${tool.blurb}

Raw signals (last 30 days unless noted):
- HN stories mentioning it (6 mo): ${signals?.hnMentions ?? 0}, avg points: ${signals?.hnPoints ?? 0}
- Reddit posts (last month): ${signals?.redditMentions ?? 0}, total upvotes: ${signals?.redditScore ?? 0}
- Wikipedia pageviews (30d): ${signals?.wikiViews30d ?? "n/a"}
- GitHub stars: ${signals?.githubStars ?? "n/a"}

Top HN headlines:
${hn.length ? hn.map((h) => `- ${h}`).join("\n") : "(none)"}

Top Reddit posts:
${reddit.length ? reddit.map((r) => `- ${r}`).join("\n") : "(none)"}

Return JSON with this exact shape:
{ "blurb": "single sentence, max 90 chars", "adjustment": number_between_-6_and_6, "noise": boolean }`;

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return {
      id: tool.id,
      blurb: String(parsed.blurb ?? "").slice(0, 120),
      adjustment: Math.max(-6, Math.min(6, Number(parsed.adjustment) || 0)),
      noise: Boolean(parsed.noise),
    };
  } catch (err) {
    console.warn(`  rerank ${tool.id} error:`, (err as Error).message);
    return null;
  }
}

async function main() {
  console.log(`Editorial rerank · ${NOW_ISO} · model=${MODEL}`);
  const liveRaw = await readFile(resolve(ROOT, "data/tools.live.json"), "utf8");
  const live = JSON.parse(liveRaw) as LiveDoc;

  // Top 40 by trending
  const ranked = [...live.tools].sort((a, b) => b.trending - a.trending).slice(0, 40);
  console.log(`Reranking top ${ranked.length} tools…`);

  const out: EditorialOutput[] = [];
  let i = 0;
  for (const entry of ranked) {
    i++;
    const tool = CATALOG.find((c) => c.id === entry.id);
    if (!tool) continue;

    process.stdout.write(`  [${i}/${ranked.length}] ${tool.name}…`);
    const [hn, reddit] = await Promise.all([
      fetchHNTitles(tool.signals?.hn || tool.name),
      fetchRedditTitles(tool.signals?.reddit || tool.name),
    ]);

    const result = await rerank(
      { id: tool.id, name: tool.name, vendor: tool.vendor, blurb: tool.blurb },
      entry.liveSignals,
      hn,
      reddit
    );

    if (result) {
      out.push(result);
      process.stdout.write(` adj=${result.adjustment >= 0 ? "+" : ""}${result.adjustment}${result.noise ? " ⚠noise" : ""}\n`);
    } else {
      process.stdout.write(` skipped\n`);
    }
  }

  const doc = { generatedAt: NOW_ISO, model: MODEL, entries: out };
  await writeFile(
    resolve(ROOT, "data/editorial.json"),
    JSON.stringify(doc, null, 2) + "\n"
  );
  console.log(`Wrote data/editorial.json with ${out.length} entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
