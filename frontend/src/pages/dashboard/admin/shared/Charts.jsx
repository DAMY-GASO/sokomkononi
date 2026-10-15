import React from "react";

/* ============================================================
   Lightweight SVG chart components — no external dependencies.
   All colors are fixed brand values (they read well on both
   light and dark surfaces). Text uses `currentColor` so it
   inherits the theme automatically.
   ============================================================ */

const FONT = "system-ui, -apple-system, Segoe UI, sans-serif";

/* ── DONUT CHART ─────────────────────────────────────────── */
export function DonutChart({
  data = [],
  size = 200,
  thickness = 28,
  centerLabel,
  centerSub,
  gap = 2,
}) {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  // Build segments
  let acc = 0;
  const segments = data
    .filter((d) => Number(d.value) > 0)
    .map((d) => {
      const v = Number(d.value) || 0;
      const pct = total > 0 ? v / total : 0;
      const len = Math.max(0, pct * C - gap);
      const seg = {
        ...d,
        pct,
        dash: `${len} ${C - len}`,
        offset: -acc * C,
      };
      acc += pct;
      return seg;
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Donut chart"
        style={{ flexShrink: 0 }}
      >
        {/* Background circle */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth={thickness}
        />
        {/* Segments */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        {/* Center label */}
        {(centerLabel || centerSub) && (
          <g>
            {centerLabel && (
              <text
                x={cx} y={cy - (centerSub ? 6 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="currentColor"
                style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700 }}
              >
                {centerLabel}
              </text>
            )}
            {centerSub && (
              <text
                x={cx} y={cy + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="currentColor"
                fillOpacity="0.6"
                style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500 }}
              >
                {centerSub}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      {segments.length > 0 && (
        <ul className="flex w-full min-w-0 flex-col gap-2 sm:max-w-[260px]">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[12px]">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="truncate text-secondary">{s.label}</span>
              <span className="ml-auto shrink-0 tabular-nums font-semibold text-primary">
                {s.display != null ? s.display : s.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── HORIZONTAL BAR CHART ────────────────────────────────── */
export function HBarChart({ data = [], valueFormat, emptyText = "—" }) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-muted">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d, i) => {
        const v = Number(d.value) || 0;
        const pct = (v / max) * 100;
        return (
          <li key={i} className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate text-secondary">{d.label}</span>
              <span className="shrink-0 tabular-nums font-semibold text-primary">
                {valueFormat ? valueFormat(v) : v}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[color:rgb(var(--c-hairline))]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: d.color || "#FEA406",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── VERTICAL BAR CHART ──────────────────────────────────── */
export function VBarChart({
  data = [],
  height = 180,
  valueFormat,
  emptyText = "—",
}) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-muted">{emptyText}</p>;
  }
  return (
    <div
      className="flex w-full items-end justify-between gap-1"
      style={{ height }}
    >
      {data.map((d, i) => {
        const v = Number(d.value) || 0;
        const pct = max > 0 ? (v / max) * 100 : 0;
        return (
          <div
            key={i}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="truncate text-[9px] tabular-nums text-muted sm:text-[10px]">
              {v > 0 && valueFormat ? valueFormat(v) : v > 0 ? v : ""}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[28px] rounded-t-md transition-all duration-700"
                style={{
                  height: `${Math.max(pct, v > 0 ? 4 : 1)}%`,
                  background: d.color || "#FEA406",
                  minHeight: v > 0 ? 3 : 1,
                }}
                title={`${d.label}: ${v}`}
              />
            </div>
            <span className="w-full truncate text-center text-[9px] text-muted sm:text-[10px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── LINE / AREA CHART ───────────────────────────────────── */
export function LineChart({
  data = [],
  height = 180,
  color = "#FEA406",
  fillOpacity = 0.18,
  valueFormat,
  emptyText = "—",
}) {
  if (!data.length || data.every((d) => (Number(d.value) || 0) === 0)) {
    return <p className="py-6 text-center text-xs text-muted">{emptyText}</p>;
  }
  const width = 600;
  const pad = 24;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const v = Number(d.value) || 0;
    const x = pad + i * stepX;
    const y = height - pad - (v / max) * (height - pad * 2);
    return { x, y, v, label: d.label };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - pad} L ${points[0].x.toFixed(1)} ${height - pad} Z`;

  const gid = `grad-${color.replace("#", "")}`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full sm:h-48"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="rgb(var(--c-card))"
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted">
        <span className="truncate">{data[0]?.label}</span>
        {data.length > 2 && (
          <span className="truncate">{data[Math.floor(data.length / 2)]?.label}</span>
        )}
        <span className="truncate">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* ── STAT MINI (used for top lists) ──────────────────────── */
export function MiniRow({ rank, label, value, sub, color = "#FEA406" }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-[color:rgb(var(--c-hairline))] py-2.5 last:border-0">
      {rank != null && (
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
          style={{
            background: `${color}20`,
            color,
          }}
        >
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-primary">{label}</p>
        {sub && <p className="truncate text-[11px] text-secondary">{sub}</p>}
      </div>
      <span className="shrink-0 tabular-nums text-[13px] font-semibold text-primary">
        {value}
      </span>
    </div>
  );
}
