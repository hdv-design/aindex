#!/usr/bin/env tsx
/**
 * AIndex data refresh.
 *
 * Pulls live signals (GitHub stars + 30d velocity, HN mentions + sentiment)
 * for every tool in the catalog, computes per-category z-scores, blends
 * them into a single trending index, and writes data/tools.live.json.
 *
 * Designed to run from GitHub Actions nightly. Uses only public, free APIs.
 *
 * Required env (optional but recommended):
 *   GITHUB_TOKEN    Personal access token, public-repo scope (5000 req/h vs 60)
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { CATALOG, type CatalogEntry } from "../lib/catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const NOW = new Date();
const NOW_ISO = NOW.toISOString();
const SIX_MONTHS_AGO = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 30 * 6);
const ONE_MONTH_AGO  = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 30);
const ONE_WEEK_AGO   = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 7);

const GH_TOKEN = process.env.GITHUB_TOKEN || "";

type RawSignals = {
  githubStars?: number;
  githubVelocity?: number;
  hnMentions?: number;
  hnPoints?: number;
  hnRecent?: number;
};

// ——————————————————————————————————————
// GitHub: stars + 30-day star velocity
// ——————————————————————————————————————
async function fetchGitHub(repo?: string): Promise<Pick<RawSignals, "githubStars" | "githubVelocity"> | null> {
  if (!repo) return null;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "aindex-refresh",
    ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
  };

  try {
    const r = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!r.ok) {
      console.warn(`  github ${repo}: ${r.status}`);
      return null;
    }
    const data = await r.json();
    const stars = data.stargazers_count ?? 0;

    // Walk to last page of stargazers to count those starred in last 30d.
    const probe = await fetch(
      `https://api.github.com/repos/${repo}/stargazers?per_page=100`,
      { headers: { ...headers, Accept: "application/vnd.github.v3.star+json" } }
    );

    let velocity = 0;
    if (probe.ok) {
      const link = probe.headers.get("link") || "";
      const match = link.match(/page=(\d+)>;\s*rel="last"/);
      const lastPage = match ? Number(match[1]) : 1;
      const lastUrl = `https://api.github.com/repos/${repo}/stargazers?per_page=100&page=${lastPage}`;
      const lastRes = await fetch(lastUrl, {
        headers: { ...headers, Accept: "application/vnd.github.v3.star+json" },
      });
      if (lastRes.ok) {
        const arr: Array<{ starred_at: string }> = await lastRes.json();
        velocity = arr.filter((s) => new Date(s.starred_at) > ONE_MONTH_AGO).length;
      }
    }

    return { githubStars: stars, githubVelocity: velocity };
  } catch (err) {
    console.warn(`  github ${repo} error:`, (err as Error).message);
    return null;
  }
}

// ——————————————————————————————————————
// Hacker News (Algolia): mentions in last 6 months + avg points
// ——————————————————————————————————————
async function fetchHN(query?: string): Promise<Pick<RawSignals, "hnMentions" | "hnPoints" | "hnRecent"> | null> {
  if (!query) return null;
  try {
    const since = Math.floor(SIX_MONTHS_AGO.getTime() / 1000);
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=200`;
    const r = await fetch(url, { headers: { "User-Agent": "aindex-refresh" } });
    if (!r.ok) return null;
    const data = await r.json();
    const hits: Array<{ created_at: string; points?: number }> = data.hits ?? [];
    if (hits.length === 0) return { hnMentions: 0, hnPoints: 0, hnRecent: 0 };

    const totalPoints = hits.reduce((sum, h) => sum + (h.points ?? 0), 0);
    const avgPoints = totalPoints / hits.length;
    const recent = hits.filter((h) => new Date(h.created_at) > ONE_WEEK_AGO).length;

    return {
      hnMentions: hits.length,
      hnPoints: Math.round(avgPoints),
      hnRecent: recent,
    };
  } catch (err) {
    console.warn(`  hn ${query} error:`, (err as Error).message);
    return null;
  }
}

// ——————————————————————————————————————
// Scoring — per-category z-scores, weighted blend
// ——————————————————————————————————————
type Enriched = CatalogEntry & { raw: RawSignals };
type Scored = Enriched & {
  z_stars: number;
  z_velocity: number;
  z_mentions: number;
  z_points: number;
  z_recent: number;
  trending: number;
  growthMoM: number;
};

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function zScoreByCategory<T extends { category: string }>(
  rows: T[], accessor: (r: T) => number | null | undefined
): Map<T, number> {
  const byCat = new Map<string, number[]>();
  for (const r of rows) {
    const v = accessor(r);
    if (v == null || !Number.isFinite(v)) continue;
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category)!.push(v as number);
  }
  const stats = new Map<string, { mean: number; sd: number }>();
  for (const [cat, vals] of byCat) {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const sd = Math.sqrt(variance) || 1;
    stats.set(cat, { mean, sd });
  }
  const result = new Map<T, number>();
  for (const r of rows) {
    const v = accessor(r);
    if (v == null || !Number.isFinite(v)) { result.set(r, 0); continue; }
    const s = stats.get(r.category);
    if (!s) { result.set(r, 0); continue; }
    result.set(r, ((v as number) - s.mean) / s.sd);
  }
  return result;
}

const zTo100 = (z: number) => clamp(50 + z * 18, 0, 100);

function computeScores(rows: Enriched[]): Scored[] {
  const z_stars    = zScoreByCategory(rows, (r) => r.raw.githubStars);
  const z_velocity = zScoreByCategory(rows, (r) => r.raw.githubVelocity);
  const z_mentions = zScoreByCategory(rows, (r) => r.raw.hnMentions);
  const z_points   = zScoreByCategory(rows, (r) => r.raw.hnPoints);
  const z_recent   = zScoreByCategory(rows, (r) => r.raw.hnRecent);

  return rows.map((r) => {
    const zS = z_stars.get(r)    ?? 0;
    const zV = z_velocity.get(r) ?? 0;
    const zM = z_mentions.get(r) ?? 0;
    const zP = z_points.get(r)   ?? 0;
    const zR = z_recent.get(r)   ?? 0;

    const momentum  = 0.6 * zV + 0.4 * zR;
    const reach     = 0.5 * zS + 0.5 * zM;
    const sentiment = zP;

    const trendingZ = 0.45 * momentum + 0.30 * reach + 0.25 * sentiment;
    const growthMoM = clamp(zV * 18, -25, 200);

    return {
      ...r,
      z_stars: zS, z_velocity: zV, z_mentions: zM, z_points: zP, z_recent: zR,
      trending: Math.round(zTo100(trendingZ) * 10) / 10,
      growthMoM: Math.round(growthMoM * 10) / 10,
    };
  });
}

function buildSpark(seed: number[], growthMoM: number) {
  const factor = 1 + clamp(growthMoM, -25, 50) / 200;
  return seed.map((v, i) => {
    const t = i / (seed.length - 1);
    const adj = v * (1 - t) + v * factor * t;
    return Math.round(adj);
  });
}

// ——————————————————————————————————————
// Main
// ——————————————————————————————————————
async function main() {
  console.log(`AIndex refresh · ${NOW_ISO}`);
  if (!GH_TOKEN) console.warn("⚠ No GITHUB_TOKEN — unauthenticated GitHub rate limit (60/h).");

  console.log(`Loaded ${CATALOG.length} tools`);

  const enriched: Enriched[] = [];
  let i = 0;
  for (const tool of CATALOG) {
    i++;
    process.stdout.write(`  [${i}/${CATALOG.length}] ${tool.name}…`);
    const [gh, hn] = await Promise.all([
      fetchGitHub(tool.signals?.github),
      fetchHN(tool.signals?.hn || tool.name),
    ]);
    const raw: RawSignals = { ...gh, ...hn };
    enriched.push({ ...tool, raw });
    process.stdout.write(
      ` stars=${raw.githubStars ?? "—"}` +
      ` vel=${raw.githubVelocity ?? "—"}` +
      ` hn=${raw.hnMentions ?? "—"}` +
      ` pts=${raw.hnPoints ?? "—"}\n`
    );
  }

  console.log("\nComputing scores…");
  const scored = computeScores(enriched);

  const out = scored.map((r) => ({
    id: r.id,
    trending: r.trending,
    growthMoM: r.growthMoM,
    rating: r.seed.rating,
    monthlyVisits: r.seed.monthlyVisits,
    spark: buildSpark(r.seed.spark, r.growthMoM),
    liveSignals: {
      githubStars: r.raw.githubStars,
      githubVelocity: r.raw.githubVelocity,
      hnMentions: r.raw.hnMentions,
      hnPoints: r.raw.hnPoints,
      fetchedAt: NOW_ISO,
    },
  }));

  const doc = { generatedAt: NOW_ISO, tools: out };
  await writeFile(
    resolve(ROOT, "data/tools.live.json"),
    JSON.stringify(doc, null, 2) + "\n"
  );
  console.log(`Wrote data/tools.live.json with ${out.length} tools.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
