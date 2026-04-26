"use client";

import { CATEGORIES, type Category } from "@/lib/tools";

type Props = {
  active: Category | "all";
  onChange: (c: Category | "all") => void;
  counts: Record<string, number>;
};

const ORDER: (Category | "all")[] = [
  "all",
  "agents",
  "code",
  "design",
  "image",
  "video",
  "audio",
  "writing",
  "research",
  "marketing",
  "sales",
  "support",
  "data",
  "procurement",
  "productivity",
  "legal",
  "hr",
];

export default function FilterRail({ active, onChange, counts }: Props) {
  return (
    <div className="border-b border-[var(--rule)] bg-[var(--bg)] sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
          {ORDER.map((c) => {
            const label = c === "all" ? "All" : CATEGORIES[c];
            const isActive = active === c;
            const count = c === "all"
              ? Object.values(counts).reduce((a, b) => a + b, 0)
              : counts[c] ?? 0;
            return (
              <button
                key={c}
                onClick={() => onChange(c)}
                className={[
                  "shrink-0 px-3 py-1.5 text-[13px] rounded-full border transition-colors duration-150 inline-flex items-center gap-1.5",
                  isActive
                    ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]"
                    : "bg-transparent text-[var(--ink-2)] border-[var(--rule-strong)] hover:border-[var(--ink)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                <span>{label}</span>
                <span
                  className={[
                    "tnum text-[10.5px] font-mono",
                    isActive ? "text-[var(--accent)]" : "text-[var(--ink-4)]",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
