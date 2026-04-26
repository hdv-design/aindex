"use client";

import Logo from "./Logo";

export default function Header() {
  const today = new Date("2026-04-21");
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="border-b border-[var(--ink)]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-6">
        <div className="flex items-baseline gap-3 min-w-0">
          <Logo size={22} />
          <span className="hidden sm:inline text-[11.5px] text-[var(--ink-3)] truncate ml-2">
            An editorial leaderboard of AI tools on the market
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[11.5px] text-[var(--ink-3)] tnum font-mono">
          <span>{dateStr}</span>
          <span className="hidden lg:inline text-[var(--ink-4)]">·</span>
          <span className="hidden lg:inline">Vol. IV · Issue 17</span>
        </div>
      </div>

      {/* Masthead headline */}
      <div className="border-t border-[var(--rule)]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14 grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <div className="eyebrow mb-3">Week 17 · Spring 2026</div>
            <h1 className="font-serif text-[44px] sm:text-[64px] lg:text-[88px] leading-[0.92] tracking-[-0.02em] text-[var(--ink)]">
              What the world is{" "}
              <span className="italic relative inline-block">
                actually
                <span className="absolute left-0 bottom-1 w-full h-[6px] bg-[var(--accent)] -z-10" aria-hidden />
              </span>{" "}
              using.
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pb-3">
            <p className="text-[14px] leading-relaxed text-[var(--ink-2)] max-w-[44ch]">
              {TOTAL_TOOLS} tools, ranked weekly by trending index, growth, rating, reach and funding. Filter by use case to surface the leaders inside your category — not the entire feed.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

const TOTAL_TOOLS = 60;
