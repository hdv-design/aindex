"use client";

import { ArrowDown, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export type SortKey = "trending" | "growth" | "rating" | "funding" | "released" | "visits";

const OPTIONS: { key: SortKey; label: string; suffix: string }[] = [
  { key: "trending", label: "Trending", suffix: "wkly index" },
  { key: "growth",   label: "Growth",    suffix: "MoM %" },
  { key: "rating",   label: "Rating",    suffix: "0–10" },
  { key: "released", label: "New",       suffix: "release date" },
  { key: "visits",   label: "Reach",     suffix: "monthly visits" },
  { key: "funding",  label: "Funding",   suffix: "USD raised" },
];

type Props = {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  query: string;
  onQuery: (q: string) => void;
  total: number;
};

export default function SortBar({ sort, onSort, query, onQuery, total }: Props) {
  const active = OPTIONS.find((o) => o.key === sort)!;
  return (
    <div className="border-b border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-4 flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8">
        <div className="flex-1">
          <div className="eyebrow mb-2">Rank by</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 items-baseline">
            {OPTIONS.map((o) => {
              const isActive = sort === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => onSort(o.key)}
                  className="group inline-flex items-baseline gap-1.5"
                >
                  <span
                    className={[
                      "font-serif text-[26px] leading-none tracking-tight transition-colors",
                      isActive ? "text-[var(--ink)]" : "text-[var(--ink-4)] group-hover:text-[var(--ink-2)]",
                    ].join(" ")}
                  >
                    {o.label}
                  </span>
                  {isActive && (
                    <span className="inline-block size-1.5 rounded-full bg-[var(--accent)] translate-y-[-4px]" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[12px] text-[var(--ink-3)] flex items-center gap-2">
            <ArrowDown size={11} weight="bold" />
            <span>Sorted by <em className="not-italic text-[var(--ink-2)]">{active.label}</em> · {active.suffix} · highest first</span>
          </div>
        </div>

        <div className="lg:w-[300px]">
          <div className="eyebrow mb-2 flex items-center justify-between">
            <span>Search</span>
            <span className="tnum font-mono text-[10.5px] text-[var(--ink-4)]">
              {total.toString().padStart(3, "0")} results
            </span>
          </div>
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
            />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Tool, vendor, capability…"
              className="w-full pl-9 pr-3 py-2 bg-transparent border border-[var(--rule-strong)] rounded-md text-[13px] focus:border-[var(--ink)] focus:outline-none placeholder:text-[var(--ink-4)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
