"use client";

import { TOOLS } from "@/lib/getTools";
import { CaretUp, CaretDown } from "@phosphor-icons/react/dist/ssr";

export default function Ticker() {
  const movers = [...TOOLS]
    .sort((a, b) => Math.abs(b.growthMoM) - Math.abs(a.growthMoM))
    .slice(0, 18);

  // Duplicate for seamless loop
  const items = [...movers, ...movers];

  return (
    <div className="border-y border-[var(--rule)] bg-[var(--bg)] overflow-hidden">
      <div className="flex items-center">
        <div className="shrink-0 px-4 py-2 border-r border-[var(--rule)] bg-[var(--ink)] text-[var(--bg)] eyebrow !text-[10px] flex items-center gap-2">
          <span className="inline-block size-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          Live · 24h
        </div>
        <div className="overflow-hidden flex-1">
          <div className="marquee-track flex whitespace-nowrap py-2">
            {items.map((t, i) => {
              const up = t.growthMoM >= 0;
              return (
                <span key={`${t.id}-${i}`} className="px-6 inline-flex items-baseline gap-2 text-[13px]">
                  <span className="font-medium">{t.name}</span>
                  <span
                    className={`tnum inline-flex items-center gap-0.5 font-mono text-[12px] ${
                      up ? "text-[var(--up)]" : "text-[var(--down)]"
                    }`}
                  >
                    {up ? <CaretUp size={10} weight="fill" /> : <CaretDown size={10} weight="fill" />}
                    {Math.abs(t.growthMoM).toFixed(1)}%
                  </span>
                  <span className="text-[var(--ink-4)]">·</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
