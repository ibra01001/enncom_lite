import React, { useRef, useState, useEffect } from 'react';

// ============================================================================
// Palette — swap or extend freely
// ============================================================================

const PALETTE = {
    red: { base: '#FF3535', light: '#FF6B5C', dark: '#CC1F2E' },
    gray: { base: '#919191', light: '#B8B8B8', dark: '#6B6B6B' },
};

function resolveColor(color) {
    if (color === 'red' || color === 'gray') return PALETTE[color];
    return { base: color, light: color, dark: color };
}

// ============================================================================
// Single Arrow
// ============================================================================

const Arrow = ({
    color = 'red',
    direction = 'down',
    delay = 0,
    height = 100,
    heightFraction = null, // 0–1: fraction of container height
    thickness = 12,
    duration = 10,
    travel = 80,
    static: isStatic = false,
    className = '',
    containerHeight = null,
}) => {
    const { light, dark } = resolveColor(color);
    const isDown = direction === 'down';
    const gradId = React.useId().replace(/:/g, '');

    // If a container height is provided, derive this arrow's height from it
    const resolvedHeight = containerHeight && heightFraction
        ? Math.round(containerHeight * heightFraction)
        : height;

    const w = 120;
    const cx = w / 2;
    const chevron = 36;
    const headGap = chevron * 0.75;
    const padTop = isDown ? thickness : headGap + thickness / 2;
    const padBottom = isDown ? headGap + thickness / 2 : thickness;

    const lineY1 = padTop;
    const lineY2 = resolvedHeight - padBottom;
    const tipY = isDown ? lineY2 + headGap * 0.55 : lineY1 - headGap * 0.55;

    return (
        <div
            className={`aa-track ${isStatic ? '' : isDown ? 'aa-move-down' : 'aa-move-up'} ${className}`}
            style={{
                width: w,
                height: resolvedHeight,
                '--aa-delay': `${delay}s`,
                '--aa-duration': `${duration}s`,
                '--aa-travel': `${travel}px`,
            }}
        >
            <svg width={w} height={resolvedHeight} viewBox={`0 0 ${w} ${resolvedHeight}`} fill="none">
                <defs>
                    <linearGradient
                        id={`grad-${gradId}`}
                        x1="0"
                        y1={isDown ? 0 : resolvedHeight}
                        x2="0"
                        y2={isDown ? resolvedHeight : 0}
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0%" stopColor={light} stopOpacity="0.35" />
                        <stop offset="55%" stopColor={light} />
                        <stop offset="100%" stopColor={dark} />
                    </linearGradient>
                    <filter id={`glow-${gradId}`} x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* shaft */}
                <line
                    x1={cx}
                    y1={lineY1}
                    x2={cx}
                    y2={lineY2}
                    stroke={`url(#grad-${gradId})`}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                />

                {/* chevron head */}
                <polyline
                    points={
                        isDown
                            ? `${cx - chevron},${lineY2 - chevron * 0.62} ${cx},${tipY} ${cx + chevron},${lineY2 - chevron * 0.62}`
                            : `${cx - chevron},${lineY1 + chevron * 0.62} ${cx},${tipY} ${cx + chevron},${lineY1 + chevron * 0.62}`
                    }
                    stroke={`url(#grad-${gradId})`}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#glow-${gradId})`}
                />
            </svg>
        </div>
    );
};

// ============================================================================
// Row wrapper
// ============================================================================

const DEFAULT_ARROWS = [
    { color: 'red', direction: 'down', delay: 0, heightFraction: 0.98 },
    { color: 'gray', direction: 'up', delay: 0.35, heightFraction: 0.82 },
    { color: 'gray', direction: 'down', delay: 0.7, heightFraction: 0.82 },
    { color: 'red', direction: 'up', delay: 0.15, heightFraction: 1.0 },
];

const AnimatedArrows = ({ arrows = DEFAULT_ARROWS, className = '' }) => {
    const stageRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(null);

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
          min-height: 100vh;
          padding: 0 48px;
        }
        .aa-row {
          display: flex;
          gap: 34px;
          align-items: center;
        }
        .aa-track {
          will-change: transform;
        }
        .aa-move-down {
          animation: aa-bounce-down var(--aa-duration) cubic-bezier(0.45, 0, 0.2, 1) infinite;
          animation-delay: var(--aa-delay);
        }
        .aa-move-up {
          animation: aa-bounce-up var(--aa-duration) cubic-bezier(0.45, 0, 0.2, 1) infinite;
          animation-delay: var(--aa-delay);
        }
        @keyframes aa-bounce-down {
          0%, 100% { transform: translateY(0); opacity: 0.92; }
          50% { transform: translateY(var(--aa-travel)); opacity: 1; }
        }
        @keyframes aa-bounce-up {
          0%, 100% { transform: translateY(0); opacity: 0.92; }
          50% { transform: translateY(calc(-1 * var(--aa-travel))); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .aa-move-down, .aa-move-up {
            animation: none;
          }
        }
      `}</style>
        </div>
    );
};

export default AnimatedArrows;
export { Arrow as AnimatedArrow };