"use client";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
}

export function BarChart({ data, title, height = 200 }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, 600 / data.length - 8));

  return (
    <div>
      {title && <p className="mb-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</p>}
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * (barWidth + 8) + 40} ${height}`} className="overflow-visible">
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height - 40);
          const x = i * (barWidth + 8) + 20;
          const y = height - 20 - barH;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={d.color || "#3b82f6"} />
              <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" className="text-[10px] fill-slate-500">
                {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
              </text>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[10px] fill-slate-600 font-medium">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  title?: string;
  size?: number;
}

export function DonutChart({ data, title, size = 160 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((d) => {
    const fraction = d.value / total;
    const length = fraction * circumference;
    const startOffset = offset;
    offset += length;
    return { ...d, fraction, length, startOffset };
  });

  return (
    <div className="flex flex-col items-center">
      {title && <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {slices.map((d) => (
          <circle
            key={d.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="20"
            strokeDasharray={`${d.length} ${circumference - d.length}`}
            strokeDashoffset={-d.startOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-2xl font-bold fill-slate-800">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-[10px] fill-slate-500">
          Total
        </text>
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-medium text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
