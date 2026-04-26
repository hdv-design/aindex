"use client";

type Props = {
  size?: number;          // wordmark height in px (matches cap-height roughly)
  className?: string;
  accent?: string;        // bottom dot color
  ink?: string;           // letterforms color
  title?: string;
};

/**
 * AIndex wordmark.
 *
 * "A" and "ndex" are real Fraunces serif text. The "I" is a custom inline
 * SVG glyph: a diagonal stem with a dot above and a dot below, simultaneously
 * reading as a serif I and a % sign. The bottom dot uses the lime accent —
 * the same color used for live deltas in the leaderboard.
 */
export default function Logo({
  size = 22,
  className = "",
  accent = "var(--accent)",
  ink = "var(--ink)",
  title = "AIndex",
}: Props) {
  // Cap-height roughly matches the rendered text size. The glyph SVG is
  // sized in the line, with proportions tuned to sit visually with Fraunces.
  const stemHeight = size * 0.92;
  const dot = Math.max(2.2, size * 0.13);
  const stemWidth = Math.max(1.6, size * 0.115);
  const slant = size * 0.14; // horizontal travel from top to bottom of stem

  // Total glyph footprint
  const glyphWidth = stemWidth + slant + dot * 2 + 2;
  const glyphHeight = stemHeight + dot * 2 + 4;

  // Coordinates inside the SVG box
  const stemTopX = dot + 1;
  const stemTopY = dot + 2;
  const stemBotX = stemTopX + slant;
  const stemBotY = stemTopY + stemHeight;

  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex items-baseline ${className}`}
      style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: ink, lineHeight: 1 }}
    >
      <span
        style={{
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          fontVariationSettings: "'opsz' 96, 'SOFT' 30",
        }}
      >
        A
      </span>

      <svg
        width={glyphWidth}
        height={glyphHeight}
        viewBox={`0 0 ${glyphWidth} ${glyphHeight}`}
        className="inline-block"
        style={{
          // Pull the glyph up so its top dot aligns with cap-height
          // and its bottom dot drops slightly below the baseline.
          transform: `translateY(${size * 0.06}px)`,
          marginInline: size * 0.04,
        }}
        aria-hidden="true"
      >
        {/* Diagonal stem (the % slash) */}
        <path
          d={`
            M ${stemTopX} ${stemTopY}
            L ${stemTopX + stemWidth} ${stemTopY}
            L ${stemBotX + stemWidth} ${stemBotY}
            L ${stemBotX} ${stemBotY}
            Z
          `}
          fill={ink}
        />
        {/* Top dot — i-tittle / % upper bullet */}
        <circle cx={stemTopX + stemWidth / 2} cy={dot * 0.6} r={dot} fill={ink} />
        {/* Bottom dot — lime accent (the live-data signature) */}
        <circle cx={stemBotX + stemWidth / 2} cy={glyphHeight - dot * 0.6} r={dot} fill={accent} />
      </svg>

      <span
        style={{
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          fontVariationSettings: "'opsz' 96, 'SOFT' 30",
        }}
      >
        ndex
      </span>
    </span>
  );
}
