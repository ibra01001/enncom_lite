import { useRef, useState, useEffect, type FC } from 'react';

// ============================================================================
// Palette
// ============================================================================

const PALETTE: Record<string, { base: string; glow: string; shadow: string }> = {
  red: { base: '#FF3535', glow: 'rgba(255,53,53,0.35)', shadow: '#CC1F2E' },
  gray: { base: '#919191', glow: 'rgba(145,145,145,0.20)', shadow: '#5a5a5a' },
};

function resolveColor(color: string) {
  return PALETTE[color] ?? { base: color, glow: 'transparent', shadow: color };
}

// ============================================================================
// Unique SVG filter id helper (avoids collisions between arrow instances)
// ============================================================================

let _uid = 0;
function uid() { return ++_uid; }

// ============================================================================
// Single Arrow — stealth-tech SVG with sharp head + slim shaft
// ============================================================================

export interface ArrowProps {
  color?: 'red' | 'gray' | string;
  direction?: 'down' | 'up';
  heightFraction?: number | null;
  height?: number;
  thickness?: number;
  className?: string;
  containerHeight?: number | null;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
}

export const Arrow: FC<ArrowProps> = ({
  color = 'red',
  direction = 'down',
  height = 300,
  heightFraction = null,
  thickness = 14,
  className = '',
  containerHeight = null,
  top = 'auto',
  left = 'auto',
  right = 'auto',
  bottom = 'auto',
}) => {
  const [filterId] = useState(() => `af-${uid()}`);
  const [clipId] = useState(() => `ac-${uid()}`);
  const isDown = direction === 'down';

  const h = containerHeight && heightFraction
    ? Math.round(containerHeight * heightFraction)
    : height;

  // Layout constants
  const W = 80;          // total svg width
  const cx = W / 2;       // centre x
  const shaftW = thickness;
  const headW = 54;          // half-width of arrowhead triangle base
  const headH = 42;          // height of arrowhead triangle

  // Shaft runs from one end to where the head begins
  const shaftTop = isDown ? 0 : headH;
  const shaftBot = isDown ? h - headH : h;

  // Arrowhead triangle – tip always faces the direction of travel
  const headTipY = isDown ? h : 0;
  const headBaseY = isDown ? h - headH : headH;

  const pts = `${cx - headW},${headBaseY} ${cx + headW},${headBaseY} ${cx},${headTipY}`;

  const { base, glow } = resolveColor(color);

  return (
    <div
      className={`aa-track ${className}`}
      style={{ width: W, height: h, position: 'absolute', top, left, right, bottom }}
    >
      <svg
        width={W}
        height={h}
        viewBox={`0 0 ${W} ${h}`}
        fill="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glow filter for crisp stealth-tech look */}
          <filter id={filterId} x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient: bright core → fades toward the shaft's trailing end */}
          <linearGradient
            id={`${filterId}-g`}
            x1="0" y1={isDown ? '0%' : '100%'}
            x2="0" y2={isDown ? '100%' : '0%'}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={base} stopOpacity="0.25" />
            <stop offset="60%" stopColor={base} stopOpacity="0.7" />
            <stop offset="100%" stopColor={base} stopOpacity="1" />
          </linearGradient>

          {/* Clip so the shaft occupies only the non-head region */}
          <clipPath id={clipId}>
            <rect x={cx - shaftW / 2} y={shaftTop} width={shaftW} height={shaftBot - shaftTop} />
          </clipPath>
        </defs>

        {/* ── Shaft glow halo (slightly wider, blurred) ── */}
        <rect
          x={cx - shaftW / 2 - 4}
          y={shaftTop}
          width={shaftW + 8}
          height={shaftBot - shaftTop}
          fill={glow}
          filter={`url(#${filterId})`}
          rx={2}
        />

        {/* ── Shaft fill with gradient ── */}
        <rect
          x={cx - shaftW / 2}
          y={shaftTop}
          width={shaftW}
          height={shaftBot - shaftTop}
          fill={`url(#${filterId}-g)`}
          rx={1}
        />

        {/* ── Shaft razor-thin highlight (left edge for 3-D pop) ── */}
        <rect
          x={cx - shaftW / 2}
          y={shaftTop}
          width={2}
          height={shaftBot - shaftTop}
          fill="rgba(255,255,255,0.18)"
          rx={1}
        />

        {/* ── Arrowhead glow halo ── */}
        <polygon
          points={pts}
          fill={glow}
          filter={`url(#${filterId})`}
        />

        {/* ── Arrowhead solid fill ── */}
        <polygon
          points={pts}
          fill={base}
        />

        {/* ── Arrowhead bevel highlight line ── */}
        <line
          x1={cx - headW}
          y1={headBaseY}
          x2={cx}
          y2={headTipY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
        />

        {/* ── Top/bottom notch line (brutalist detail) ── */}
        <line
          x1={cx - shaftW / 2}
          y1={isDown ? 0 : h}
          x2={cx + shaftW / 2}
          y2={isDown ? 0 : h}
          stroke={base}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      </svg>
    </div>
  );
};

// ============================================================================
// Row wrapper
// ============================================================================

const DEFAULT_ARROWS: ArrowProps[] = [
  { color: 'red', direction: 'down', heightFraction: 0.88, top: '0%', left: '30%' },
  { color: 'gray', direction: 'up', heightFraction: 0.72, top: '50%', left: '20%' },
  { color: 'gray', direction: 'down', heightFraction: 0.60, top: '0%', left: '60%' },
  { color: 'red', direction: 'up', heightFraction: 0.82, top: '19%', left: '70%' },
];

export interface AnimatedArrowsProps {
  arrows?: ArrowProps[];
  className?: string;
}

const AnimatedArrows: FC<AnimatedArrowsProps> = ({ arrows = DEFAULT_ARROWS, className = '' }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    observer.observe(stageRef.current);
    setContainerHeight(stageRef.current.clientHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className={`aa-stage ${className}`}>
      <div className="aa-row">
        {arrows.map((props, i) => (
          <Arrow key={i} {...props} containerHeight={containerHeight} />
        ))}
      </div>

      <style>{`
        .aa-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 0 32px;
        }
        .aa-row {
          position: relative;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default AnimatedArrows;
export { Arrow as AnimatedArrow };
