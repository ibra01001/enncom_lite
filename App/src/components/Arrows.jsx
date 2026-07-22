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
    thickness = 24,
    duration = 10,
    travel = 80,
    static: isStatic = false,
    className = '',
    containerHeight = null,
    top = 'auto',
    left = 'auto',
    right = 'auto',
    bottom = 'auto'
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
    const chevron = 50;
    const headHeight = chevron * 0.7;

    const lineY1 = isDown ? 0 : resolvedHeight;
    const lineY2 = isDown ? resolvedHeight - headHeight : headHeight;

    const baseY = isDown ? resolvedHeight - headHeight : headHeight;
    const tipY = isDown ? resolvedHeight : 0;

    return (
        <div
            className={`aa-track ${className}`}
            style={{
                width: w,
                height: resolvedHeight,
                position: 'absolute',
                top,
                left,
                right,
                bottom
            }}
        >
            <svg width={w} height={resolvedHeight} viewBox={`0 0 ${w} ${resolvedHeight}`} fill="none">
                {/* shaft */}
                <line
                    x1={cx}
                    y1={lineY1}
                    x2={cx}
                    y2={lineY2}
                    stroke={resolveColor(color).base}
                    strokeWidth={thickness}
                />

                {/* full triangle head */}
                <polygon
                    points={`${cx - chevron},${baseY} ${cx + chevron},${baseY} ${cx},${tipY}`}
                    fill={resolveColor(color).base}
                />
            </svg>
        </div>
    );
};

// ============================================================================
// Row wrapper
// ============================================================================

const DEFAULT_ARROWS = [
    { color: 'red', direction: 'down', heightFraction: 0.9, top: '0%', left: '0%' },
    { color: 'gray', direction: 'up', heightFraction: 0.8, top: '20%', left: '50%' },
    { color: 'gray', direction: 'down', heightFraction: 0.6, top: '0%', left: '70%' },
    { color: 'red', direction: 'up', heightFraction: 0.9, top: '10%', right: '10%' },
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
          padding: 0 48px;
        }
        .aa-row {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .aa-track {
          /* Flat styling keeps everything stationary */
        }
      `}</style>
        </div>
    );
};

export default AnimatedArrows;
export { Arrow as AnimatedArrow };