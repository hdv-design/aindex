"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CaretUp, CaretDown, ArrowUpRight, Star } from "@phosphor-icons/react/dist/ssr";
import Sparkline from "./Sparkline";
import { CATEGORIES, pricingLabel, type Tool } from "@/lib/tools";
import type { SortKey } from "./SortBar";

type Props = {
  tools: Tool[];
  sort: SortKey;
};

function formatVisits(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}B`;
  if (m >= 1) return `${m.toFixed(1)}M`;
  return `${(m * 1000).toFixed(0)}K`;
}

function formatFunding(m: number) {
  if (m === 0) return "—";
  if (m >= 1000) return `$${(m / 1000).toFixed(1)}B`;
  return `$${m.toFixed(0)}M`;
}

function formatReleased(iso: string) {
  const d = new Date(iso);
  const now = new Date("2026-04-21");
  const days = Math.floor((+now - +d) / 86400000);
  if (days <= 0) return "today";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function tagStyle(tag?: string) {
  switch (tag) {
    case "new":
      return "bg-[var(--accent)] text-[var(--ink)]";
    case "hot":
      return "bg-[var(--ink)] text-[var(--bg)]";
    case "rising":
      return "border border-[var(--ink)] text-[var(--ink)]";
    case "classic":
      return "border border-[var(--rule-strong)] text-[var(--ink-3)]";
    default:
      return "";
  }
}

export default function Leaderboard({ tools, sort }: Props) {
  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pb-32">
      {/* Column header */}
      <div className="hidden lg:grid grid-cols-[56px_1fr_120px_88px_88px_104px_120px_72px_40px] items-end gap-6 py-3 border-b border-[var(--ink)] text-[10.5px] uppercase tracking-[0.14em] text-[var(--ink-3)] font-medium sticky top-[57px] bg-[var(--bg)] z-20">
        <div>Rank</div>
        <div>Tool</div>
        <div>Category</div>
        <div className="text-right">Rating</div>
        <div className="text-right">Pricing</div>
        <div className="text-right">Δ Mo/Mo</div>
        <div>12-week trend</div>
        <div className="text-right">Released</div>
        <div></div>
      </div>

      <div>
        <AnimatePresence initial={false}>
          {tools.map((t, i) => {
            const up = t.growthMoM >= 0;
            const isTop = i < 3;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                className="row-hover group border-b border-[var(--rule)] transition-colors"
              >
                {/* Desktop row */}
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:grid grid-cols-[56px_1fr_120px_88px_88px_104px_120px_72px_40px] items-center gap-6 py-4"
                >
                  {/* Rank */}
                  <div className="flex items-baseline gap-1">
                    <span
                      className={[
                        "font-serif tnum leading-none",
                        isTop ? "text-[36px]" : "text-[24px]",
                        isTop ? "text-[var(--ink)]" : "text-[var(--ink-3)]",
                      ].join(" ")}
                    >
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Tool */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium tracking-tight text-[var(--ink)] truncate">
                        {t.name}
                      </span>
                      {t.tag && (
                        <span
                          className={[
                            "uppercase text-[9px] tracking-[0.14em] px-1.5 py-0.5 rounded-sm font-medium",
                            tagStyle(t.tag),
                          ].join(" ")}
                        >
                          {t.tag}
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-[var(--ink-3)] truncate mt-0.5">
                      <span className="text-[var(--ink-2)]">{t.vendor}</span>
                      <span className="mx-1.5 text-[var(--ink-4)]">·</span>
                      {t.blurb}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="text-[12px] text-[var(--ink-2)]">
                    {CATEGORIES[t.category]}
                  </div>

                  {/* Rating */}
                  <div className="text-right tnum font-mono text-[13px] text-[var(--ink)] inline-flex items-center justify-end gap-1">
                    <Star size={11} weight="fill" className="text-[var(--ink-3)]" />
                    {t.rating.toFixed(1)}
                  </div>

                  {/* Pricing */}
                  <div className="text-right text-[12px] text-[var(--ink-2)]">
                    {pricingLabel(t.pricing)}
                  </div>

                  {/* Delta */}
                  <div
                    className={[
                      "text-right tnum font-mono text-[13px] inline-flex items-center justify-end gap-0.5",
                      up ? "text-[var(--up)]" : "text-[var(--down)]",
                    ].join(" ")}
                  >
                    {up ? <CaretUp size={10} weight="fill" /> : <CaretDown size={10} weight="fill" />}
                    {Math.abs(t.growthMoM).toFixed(1)}%
                  </div>

                  {/* Sparkline */}
                  <div className="flex items-center">
                    <Sparkline data={t.spark} positive={up} />
                  </div>

                  {/* Released */}
                  <div className="text-right text-[12px] text-[var(--ink-3)] tnum">
                    {formatReleased(t.released)}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end">
                    <span className="text-[var(--ink-4)] group-hover:text-[var(--ink)] transition-colors">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </a>

                {/* Mobile row */}
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="lg:hidden block py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="font-serif tnum text-[28px] leading-none w-[44px] shrink-0 text-[var(--ink-3)]">
                      {(i + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-medium">{t.name}</span>
                        {t.tag && (
                          <span
                            className={[
                              "uppercase text-[9px] tracking-[0.14em] px-1.5 py-0.5 rounded-sm font-medium",
                              tagStyle(t.tag),
                            ].join(" ")}
                          >
                            {t.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[12.5px] text-[var(--ink-3)] mt-0.5">
                        <span className="text-[var(--ink-2)]">{t.vendor}</span>
                        <span className="mx-1.5 text-[var(--ink-4)]">·</span>
                        {CATEGORIES[t.category]}
                      </div>
                      <div className="text-[13px] text-[var(--ink-2)] mt-1.5 leading-snug">{t.blurb}</div>

                      <div className="mt-3 flex items-center gap-4 text-[12px]">
                        <span className="tnum font-mono inline-flex items-center gap-1">
                          <Star size={11} weight="fill" className="text-[var(--ink-3)]" />
                          {t.rating.toFixed(1)}
                        </span>
                        <span className={`tnum font-mono inline-flex items-center gap-0.5 ${up ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                          {up ? <CaretUp size={10} weight="fill" /> : <CaretDown size={10} weight="fill" />}
                          {Math.abs(t.growthMoM).toFixed(1)}%
                        </span>
                        <span className="text-[var(--ink-3)]">{pricingLabel(t.pricing)}</span>
                        <Sparkline data={t.spark} positive={up} width={64} height={20} />
                      </div>
                    </div>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {tools.length === 0 && (
        <div className="py-24 text-center">
          <div className="font-serif text-[36px] text-[var(--ink)]">No tools.</div>
          <div className="text-[13px] text-[var(--ink-3)] mt-2">
            Try a different category or clear the search.
          </div>
        </div>
      )}

      {/* Methodology footnote */}
      <div className="mt-12 pt-6 border-t border-[var(--rule)] text-[11px] text-[var(--ink-3)] leading-relaxed max-w-[640px]">
        <div className="eyebrow mb-2">Methodology</div>
        Trending is a 0–100 weekly momentum index combining usage growth, social mentions, and developer-survey sentiment. Δ Mo/Mo reflects estimated month-over-month traffic change. Reach is monthly visits per Similarweb-style estimates. Funding is total disclosed venture investment.
      </div>
    </div>
  );
}
