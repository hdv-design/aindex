export type Category =
  | "design"
  | "code"
  | "writing"
  | "video"
  | "audio"
  | "image"
  | "research"
  | "marketing"
  | "procurement"
  | "sales"
  | "support"
  | "data"
  | "agents"
  | "productivity"
  | "legal"
  | "hr";

export type Pricing = "free" | "freemium" | "paid" | "enterprise";

/** Public signal sources for live data fetching */
export type SignalSources = {
  github?: string;        // "owner/repo"
  hn?: string;            // Algolia HN search term (defaults to tool name)
  ph?: string;            // Producthunt slug (Phase 2)
  reddit?: string;        // Reddit search term (Phase 2)
  wiki?: string;          // Wikipedia article slug (Phase 2)
};

export type ToolStatic = {
  id: string;
  name: string;
  vendor: string;
  blurb: string;
  category: Category;
  pricing: Pricing;
  founded: number;
  released: string;
  funding: number;          // USD millions disclosed
  url: string;
  tag?: "new" | "hot" | "rising" | "classic";
  signals?: SignalSources;
};

export type ToolMetrics = {
  rating: number;           // 0–10 — manual editorial seed for now
  trending: number;         // 0–100 weekly momentum
  growthMoM: number;        // % month-over-month
  monthlyVisits: number;    // millions
  spark: number[];          // 12 points, weekly trend
};

export type Tool = ToolStatic & ToolMetrics & {
  /** Per-signal raw values, present when live data is loaded */
  liveSignals?: {
    githubStars?: number;
    githubVelocity?: number; // 30d star delta
    hnMentions?: number;
    hnPoints?: number;
    fetchedAt?: string;
  };
};

export const CATEGORIES: Record<Category, string> = {
  design: "Design",
  code: "Code",
  writing: "Writing",
  video: "Video",
  audio: "Audio",
  image: "Image",
  research: "Research",
  marketing: "Marketing",
  procurement: "Procurement",
  sales: "Sales",
  support: "Support",
  data: "Data & BI",
  agents: "Agents",
  productivity: "Productivity",
  legal: "Legal",
  hr: "HR",
};

export function categoryLabel(c: Category) { return CATEGORIES[c]; }
export function pricingLabel(p: Pricing) {
  return p === "free" ? "Free" : p === "freemium" ? "Freemium" : p === "paid" ? "Paid" : "Enterprise";
}
