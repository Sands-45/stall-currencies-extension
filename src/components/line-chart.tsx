import React from "react";

export interface CurrencyTrendPoint {
  label: string;
  fromRate: number;
  toRate: number;
}

interface LineChartProps {
  data: CurrencyTrendPoint[];
  fromCurrency: string;
  toCurrency: string;
  className?: string;
}

interface ChartPoint {
  x: number;
  y: number;
}

const SKY_BLUE = "#38bdf8";
const TEAL = "#14b8a6";

const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 280;
const PLOT_LEFT = 24;
const PLOT_RIGHT = 24;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 224;

const mapValuesToBand = (
  values: number[],
  bandTop: number,
  bandBottom: number,
): number[] => {
  if (values.length === 0) {
    return [];
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return Array(values.length).fill((bandTop + bandBottom) / 2);
  }

  const bandHeight = bandBottom - bandTop;
  return values.map((value) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    return bandBottom - normalized * bandHeight;
  });
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const formatRate = (value: number): string => {
  if (value === 0) return "0";
  if (value >= 1) return value.toFixed(4);
  return value.toPrecision(4);
};

const formatHoverValue = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  const fixed = value >= 1 ? value.toFixed(4) : value.toPrecision(4);
  return fixed.replace(/\.?0+$/, "");
};

const buildSmoothPath = (points: ChartPoint[]): string => {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0]?.x.toFixed(2)} ${points[0]?.y.toFixed(2)}`;
  }

  let path = `M ${points[0]?.x.toFixed(2)} ${points[0]?.y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    if (!p0 || !p1 || !p2 || !p3) {
      continue;
    }

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
};

export const LineChart = ({
  data,
  fromCurrency,
  toCurrency,
  className = "",
}: LineChartProps) => {
  const hasEnoughData = data.length >= 2;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const chart = React.useMemo(() => {
    if (!hasEnoughData) {
      return null;
    }

    const plotWidth = VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT;
    const stepX = plotWidth / (data.length - 1);
    const xPoints = data.map((_, index) => PLOT_LEFT + index * stepX);

    const mid = (PLOT_TOP + PLOT_BOTTOM) / 2;
    const fromBandTop = PLOT_TOP + 8;
    const fromBandBottom = mid - 12;
    const toBandTop = mid + 12;
    const toBandBottom = PLOT_BOTTOM - 8;

    const fromValues = data.map((point) => point.fromRate);
    const toValues = data.map((point) => point.toRate);
    const fromY = mapValuesToBand(fromValues, fromBandTop, fromBandBottom);
    const toY = mapValuesToBand(toValues, toBandTop, toBandBottom);

    const fromPoints: ChartPoint[] = xPoints.map((x, index) => ({
      x,
      y: fromY[index] ?? fromBandBottom,
    }));

    const toPoints: ChartPoint[] = xPoints.map((x, index) => ({
      x,
      y: toY[index] ?? toBandBottom,
    }));

    return {
      xPoints,
      fromPoints,
      toPoints,
      fromPath: buildSmoothPath(fromPoints),
      toPath: buildSmoothPath(toPoints),
    };
  }, [data, hasEnoughData]);

  if (!chart) {
    return (
      <div className={`w-full ${className}`.trim()}>
        <div className="h-48 w-full rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          Not enough data to draw trend lines.
        </div>
      </div>
    );
  }

  const rowLines = Array.from({ length: 5 }, (_, index) => {
    const y = PLOT_TOP + (index * (PLOT_BOTTOM - PLOT_TOP)) / 4;
    return y;
  });

  const activeIndex = hoveredIndex;
  const activeDataPoint = activeIndex !== null ? data[activeIndex] : null;
  const activeX = activeIndex !== null ? chart.xPoints[activeIndex] : undefined;
  const activeFromPoint =
    activeIndex !== null ? chart.fromPoints[activeIndex] : undefined;
  const activeToPoint =
    activeIndex !== null ? chart.toPoints[activeIndex] : undefined;

  const hoverPanelWidth = 190;
  const hoverPanelHeight = 74;
  const hoverPanelX =
    activeX !== undefined
      ? clamp(
          activeX + 12,
          PLOT_LEFT,
          VIEWBOX_WIDTH - PLOT_RIGHT - hoverPanelWidth,
        )
      : 0;
  const hoverPanelY = PLOT_TOP + 34;
  const activeLabel = activeDataPoint?.label ?? "";
  const activeLabelWidth = activeLabel.length * 7.5 + 28;
  const activeLabelPillX =
    activeX !== undefined
      ? clamp(
          activeX - activeLabelWidth / 2,
          PLOT_LEFT,
          VIEWBOX_WIDTH - PLOT_RIGHT - activeLabelWidth,
        )
      : 0;
  const activeLabelPillY = 236;

  return (
    <div className={`w-full ${className}`.trim()}>
      <svg
        aria-label={`Last 7 days trend for ${fromCurrency} and ${toCurrency}`}
        className="h-64 w-full"
        onMouseLeave={() => setHoveredIndex(null)}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <rect
          fill="transparent"
          height={VIEWBOX_HEIGHT}
          width={VIEWBOX_WIDTH}
          x={0}
          y={0}
        />

        {rowLines.map((y) => (
          <line
            key={`h-${y}`}
            stroke="#334155"
            strokeDasharray="4 6"
            strokeOpacity={0.35}
            x1={PLOT_LEFT}
            x2={VIEWBOX_WIDTH - PLOT_RIGHT}
            y1={y}
            y2={y}
          />
        ))}

        {chart.xPoints.map((x) => (
          <line
            key={`v-${x}`}
            stroke="#1e293b"
            strokeDasharray="3 7"
            strokeOpacity={0.35}
            x1={x}
            x2={x}
            y1={PLOT_TOP}
            y2={PLOT_BOTTOM}
          />
        ))}

        {activeX !== undefined ? (
          <line
            stroke="#64748b"
            strokeDasharray="2 6"
            strokeWidth={1.5}
            x1={activeX}
            x2={activeX}
            y1={PLOT_TOP}
            y2={activeLabelPillY}
          />
        ) : null}

        <path
          d={chart.fromPath}
          fill="none"
          stroke={SKY_BLUE}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />

        <path
          d={chart.toPath}
          fill="none"
          stroke={TEAL}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />

        {activeFromPoint ? (
          <circle
            cx={activeFromPoint.x}
            cy={activeFromPoint.y}
            fill={SKY_BLUE}
            r={5}
            stroke="#0f172a"
            strokeWidth={2}
          />
        ) : null}

        {activeToPoint ? (
          <circle
            cx={activeToPoint.x}
            cy={activeToPoint.y}
            fill={TEAL}
            r={5}
            stroke="#0f172a"
            strokeWidth={2}
          />
        ) : null}

        {activeDataPoint ? (
          <g>
            <rect
              fill="#020617"
              fillOpacity={0.9}
              height={hoverPanelHeight}
              rx={8}
              ry={8}
              stroke="#1e293b"
              strokeWidth={1}
              width={hoverPanelWidth}
              x={hoverPanelX}
              y={hoverPanelY}
            />
            <text fill="#e2e8f0" fontSize="13" fontWeight={600} x={hoverPanelX + 12} y={hoverPanelY + 19}>
              {activeDataPoint.label}
            </text>
            <circle cx={hoverPanelX + 15} cy={hoverPanelY + 35} fill={SKY_BLUE} r={4} />
            <text fill="#94a3b8" fontSize="11" x={hoverPanelX + 26} y={hoverPanelY + 39}>
              {fromCurrency.toLowerCase()}
            </text>
            <text
              fill="#f8fafc"
              fontSize="12"
              fontWeight={600}
              textAnchor="end"
              x={hoverPanelX + hoverPanelWidth - 10}
              y={hoverPanelY + 39}
            >
              {formatHoverValue(activeDataPoint.fromRate)}
            </text>

            <circle cx={hoverPanelX + 15} cy={hoverPanelY + 56} fill={TEAL} r={4} />
            <text fill="#94a3b8" fontSize="11" x={hoverPanelX + 26} y={hoverPanelY + 60}>
              {toCurrency.toLowerCase()}
            </text>
            <text
              fill="#f8fafc"
              fontSize="12"
              fontWeight={600}
              textAnchor="end"
              x={hoverPanelX + hoverPanelWidth - 10}
              y={hoverPanelY + 60}
            >
              {formatHoverValue(activeDataPoint.toRate)}
            </text>
          </g>
        ) : null}

        {chart.xPoints.map((x, index) => (
          <text
            dominantBaseline="middle"
            fill={
              activeIndex !== null && activeIndex === index ? "transparent" : "#94a3b8"
            }
            fontSize="12"
            key={`${data[index]?.label ?? "tick"}-${x}`}
            textAnchor="middle"
            x={x}
            y={252}
          >
            {data[index]?.label}
          </text>
        ))}

        {chart.xPoints.map((x, index) => {
          const prevX = chart.xPoints[index - 1];
          const nextX = chart.xPoints[index + 1];
          const leftBoundary = prevX === undefined ? PLOT_LEFT : (prevX + x) / 2;
          const rightBoundary =
            nextX === undefined ? VIEWBOX_WIDTH - PLOT_RIGHT : (nextX + x) / 2;

          return (
            <rect
              fill="transparent"
              height={PLOT_BOTTOM - PLOT_TOP}
              key={`hover-zone-${x}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onPointerEnter={() => setHoveredIndex(index)}
              width={Math.max(0, rightBoundary - leftBoundary)}
              x={leftBoundary}
              y={PLOT_TOP}
            />
          );
        })}

        {activeDataPoint && activeX !== undefined ? (
          <g>
            <rect
              fill="#f8fafc"
              height={30}
              rx={15}
              ry={15}
              width={activeLabelWidth}
              x={activeLabelPillX}
              y={activeLabelPillY}
            />
            <text
              fill="#0f172a"
              fontSize="14"
              fontWeight={600}
              textAnchor="middle"
              x={activeX}
              y={activeLabelPillY + 20}
            >
              {activeDataPoint.label}
            </text>
          </g>
        ) : null}

        <g transform={`translate(${PLOT_LEFT}, 10)`}>
          <circle cx={4} cy={4} fill={SKY_BLUE} r={4} />
          <text fill="#cbd5e1" fontSize="12" x={14} y={8}>
            {fromCurrency}
          </text>

          <circle cx={82} cy={4} fill={TEAL} r={4} />
          <text fill="#cbd5e1" fontSize="12" x={92} y={8}>
            {toCurrency}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default LineChart;
