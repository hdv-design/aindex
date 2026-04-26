"use client";

type Props = {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
};

export default function Sparkline({ data, width = 96, height = 26, positive = true }: Props) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");

  const fillD =
    `${d} L ${(width).toFixed(1)} ${height} L 0 ${height} Z`;

  const stroke = positive ? "var(--ink)" : "var(--down)";
  const fillId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${fillId})`} />
      <path d={d} className="spark" stroke={stroke} strokeWidth={1.2} />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2}
        fill={stroke}
      />
    </svg>
  );
}
