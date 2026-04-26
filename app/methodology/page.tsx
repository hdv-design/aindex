import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Logo from "@/components/Logo";
import { GENERATED_AT, EDITORIAL_AT } from "@/lib/getTools";

export const metadata = {
  title: "Methodology — AIndex",
  description: "How AIndex ranks AI tools: signal sources, scoring, and the weekly editorial pass.",
};

function fmt(iso: string) {
  const d = new Date(iso);
  if (+d === 0) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

export default function MethodologyPage() {
  return (
    <main className="flex-1">
      <header className="border-b border-[var(--ink)]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-6">
          <Logo size={22} />
          <Link href="/" className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink)] inline-flex items-center gap-1.5">
            <ArrowLeft size={12} weight="bold" /> Back to leaderboard
          </Link>
        </div>
      </header>

      <article className="max-w-[760px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="eyebrow mb-3">Methodology · v1.0</div>
        <h1 className="font-serif text-[44px] sm:text-[60px] leading-[0.95] tracking-[-0.02em] mb-4">
          How we rank.
        </h1>
        <p className="text-[15.5px] leading-[1.7] text-[var(--ink-2)] mb-12">
          AIndex doesn&apos;t pretend to know everything — no public source does. What it does is blend the strongest <em>free</em> public signals into a single trending index, then have an editor (in our case, Claude) read the headlines behind the numbers and adjust for hype-vs-substance.
        </p>

        <Section title="Signals">
          <Row label="Hacker News mentions">
            6-month story count + average points, via Algolia&apos;s public HN API.
          </Row>
          <Row label="Reddit posts">
            Last 30 days of mentions with total upvotes, via Reddit&apos;s public JSON.
          </Row>
          <Row label="Wikipedia pageviews">
            30-day total via the Wikimedia REST API. Strong reach proxy for tools with a wiki page.
          </Row>
          <Row label="GitHub stars + 30d velocity">
            Where the tool is open-source. Velocity is the count of stars added in the last month.
          </Row>
          <Row label="Funding">
            Total disclosed venture investment (manually curated; Crunchbase tier coming).
          </Row>
        </Section>

        <Section title="Scoring">
          <p className="text-[14px] leading-[1.7] text-[var(--ink-2)] mb-4">
            Each signal is z-scored <em>within its category</em>. That means a small enterprise tool isn&apos;t crushed by ChatGPT — it competes against its peers (other procurement tools, other legal tools), not the entire field.
          </p>
          <pre className="font-mono text-[12.5px] bg-[var(--bg-2)] border border-[var(--rule)] p-4 rounded-md overflow-x-auto leading-[1.7]">
{`momentum  = 0.45·gh_velocity + 0.30·hn_recent + 0.25·reddit_mentions
reach     = 0.35·gh_stars    + 0.30·hn_total  + 0.35·wiki_views
sentiment = 0.55·hn_points   + 0.45·reddit_score

trending = 0.45·momentum + 0.30·reach + 0.25·sentiment`}
          </pre>
        </Section>

        <Section title="The editorial pass">
          <p className="text-[14px] leading-[1.7] text-[var(--ink-2)]">
            Once a week, Claude reads the top-40 tools&apos; raw signals plus the headlines that drove them and (a) writes a one-sentence trend blurb, (b) applies a small ±6 adjustment for hype vs substance, (c) flags <em>noise</em> — cases where a brand name caught false-positive mentions. Noise-flagged tools are demoted 15 points.
          </p>
        </Section>

        <Section title="Cadence">
          <Row label="Last signal refresh">{fmt(GENERATED_AT)}</Row>
          <Row label="Last editorial pass">{fmt(EDITORIAL_AT)}</Row>
          <Row label="Refresh job">Nightly · 03:14 UTC · GitHub Actions</Row>
          <Row label="Editorial job">Weekly · Sundays · 04:14 UTC · GitHub Actions</Row>
        </Section>

        <Section title="Known limits">
          <ul className="text-[14px] leading-[1.8] text-[var(--ink-2)] list-none pl-0 space-y-2">
            <li className="flex gap-3"><span className="text-[var(--ink-4)]">·</span>Closed-source enterprise tools have weak public signal; their rank leans on funding, Wikipedia views, and the editorial pass.</li>
            <li className="flex gap-3"><span className="text-[var(--ink-4)]">·</span>Generic brand names (e.g. &ldquo;Coupa&rdquo;) catch false positives; we expect the editorial pass to flag and demote these.</li>
            <li className="flex gap-3"><span className="text-[var(--ink-4)]">·</span>No paid signals (Similarweb, Crunchbase, X/Twitter) — accuracy is &ldquo;~80% of paid&rdquo; at $0/mo.</li>
          </ul>
        </Section>
      </article>

      <footer className="border-t border-[var(--ink)]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Logo size={18} />
          <Link href="/" className="text-[11.5px] text-[var(--ink-3)] hover:text-[var(--ink)] tnum font-mono">
            Back to leaderboard →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-serif text-[28px] tracking-tight mb-5">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline border-b border-[var(--rule)] py-3 leader">
      <span className="text-[12px] uppercase tracking-[0.12em] text-[var(--ink-3)] shrink-0">{label}</span>
      <span className="text-[14px] text-[var(--ink)] shrink-0">{children}</span>
    </div>
  );
}
