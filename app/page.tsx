"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import FilterRail from "@/components/FilterRail";
import SortBar, { type SortKey } from "@/components/SortBar";
import Leaderboard from "@/components/Leaderboard";
import Logo from "@/components/Logo";
import { TOOLS, GENERATED_AT } from "@/lib/getTools";
import type { Category } from "@/lib/tools";

export default function Page() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortKey>("trending");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    return TOOLS.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS
      .filter((t) => (category === "all" ? true : t.category === category))
      .filter((t) =>
        q.length === 0
          ? true
          : t.name.toLowerCase().includes(q) ||
            t.vendor.toLowerCase().includes(q) ||
            t.blurb.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        switch (sort) {
          case "trending": return b.trending - a.trending;
          case "growth":   return b.growthMoM - a.growthMoM;
          case "rating":   return b.rating - a.rating;
          case "funding":  return b.funding - a.funding;
          case "visits":   return b.monthlyVisits - a.monthlyVisits;
          case "released": return +new Date(b.released) - +new Date(a.released);
        }
      });
  }, [category, query, sort]);

  return (
    <main className="flex-1">
      <Header />
      <Ticker />
      <FilterRail active={category} onChange={setCategory} counts={counts} />
      <SortBar sort={sort} onSort={setSort} query={query} onQuery={setQuery} total={filtered.length} />
      <Leaderboard tools={filtered} sort={sort} />

      <footer className="border-t border-[var(--ink)]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo size={18} />
          <div className="flex items-center gap-5 text-[11.5px] text-[var(--ink-3)] tnum font-mono">
            <a href="/methodology" className="hover:text-[var(--ink)]">Methodology</a>
            <span className="text-[var(--ink-4)]">·</span>
            <span>
              {(() => {
                const t = new Date(GENERATED_AT);
                if (+t === 0) return "Awaiting first refresh";
                return `Last refresh · ${t.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`;
              })()}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
