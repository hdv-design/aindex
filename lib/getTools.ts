import { CATALOG } from "./catalog";
import liveData from "../data/tools.live.json";
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
    fetchedAt?: string;
  };
};

type LiveDoc = {
  generatedAt: string;
  tools: LiveEntry[];
};

const live = liveData as LiveDoc;
const liveById = new Map<string, LiveEntry>(live.tools.map((e) => [e.id, e]));

export const TOOLS: Tool[] = CATALOG.map((c) => {
  const l = liveById.get(c.id);
  return {
    id: c.id,
    name: c.name,
    vendor: c.vendor,
    blurb: c.blurb,
    category: c.category,
    pricing: c.pricing,
    founded: c.founded,
    released: c.released,
    funding: c.funding,
    url: c.url,
    tag: c.tag,
    signals: c.signals,
    rating: l?.rating ?? c.seed.rating,
    trending: l?.trending ?? c.seed.trending,
    growthMoM: l?.growthMoM ?? c.seed.growthMoM,
    monthlyVisits: l?.monthlyVisits ?? c.seed.monthlyVisits,
    spark: l?.spark ?? c.seed.spark,
    liveSignals: l?.liveSignals,
  };
});

export const GENERATED_AT: string = live.generatedAt;
