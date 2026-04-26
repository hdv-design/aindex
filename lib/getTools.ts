import { CATALOG } from "./catalog";
import liveData from "../data/tools.live.json";
import editorialData from "../data/editorial.json";
import type { Tool } from "./tools";

type LiveEntry = {
  id: string;
  rating?: number;
  trending?: number;
  growthMoM?: number;
  monthlyVisits?: number;
  spark?: number[];
  liveSignals?: {
    githubStars?: number;
    githubVelocity?: number;
    hnMentions?: number;
    hnPoints?: number;
    redditMentions?: number;
    redditScore?: number;
    wikiViews30d?: number;
    fetchedAt?: string;
  };
};

type LiveDoc = {
  generatedAt: string;
  tools: LiveEntry[];
};

const live = liveData as LiveDoc;
const liveById = new Map<string, LiveEntry>(live.tools.map((e) => [e.id, e]));

type EditorialEntry = { id: string; blurb: string; adjustment: number; noise: boolean };
type EditorialDoc = { generatedAt: string; model: string; entries: EditorialEntry[] };
const editorial = editorialData as EditorialDoc;
const editorialById = new Map<string, EditorialEntry>(editorial.entries.map((e) => [e.id, e]));

export const TOOLS: Tool[] = CATALOG.map((c) => {
  const l = liveById.get(c.id);
  const ed = editorialById.get(c.id);
  const trendingBase = l?.trending ?? c.seed.trending;
  // Apply editorial adjustment, clamp 0–100. Noise demotes by 15.
  const trending = Math.max(
    0,
    Math.min(100, trendingBase + (ed?.adjustment ?? 0) - (ed?.noise ? 15 : 0))
  );
  return {
    id: c.id,
    name: c.name,
    vendor: c.vendor,
    blurb: ed?.blurb && !ed.noise ? ed.blurb : c.blurb,
    category: c.category,
    pricing: c.pricing,
    founded: c.founded,
    released: c.released,
    funding: c.funding,
    url: c.url,
    tag: c.tag,
    signals: c.signals,
    rating: l?.rating ?? c.seed.rating,
    trending: Math.round(trending * 10) / 10,
    growthMoM: l?.growthMoM ?? c.seed.growthMoM,
    monthlyVisits: l?.monthlyVisits ?? c.seed.monthlyVisits,
    spark: l?.spark ?? c.seed.spark,
    liveSignals: l?.liveSignals,
  };
});

export const GENERATED_AT: string = live.generatedAt;
export const EDITORIAL_AT: string = editorial.generatedAt;
