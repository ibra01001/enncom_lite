import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/**
 * Adaptive call-stage layout — inspired by LiveKit + meeting-grid-layout.
 *
 * Measures the REAL container width/height (ResizeObserver) and picks
 * the grid that maximises usable tile area at 16:9, instead of mapping
 * participant count → fixed breakpoint columns.
 */

export interface AdaptiveLayout {
  columns: number;
  rows: number;
  gap: number; // px
  tileW: number; // px (computed ideal — CSS will use flex/grid, this is for density decisions)
  tileH: number;
  visibleCount: number; // how many fit before overflow
  totalPages: number;
  /** clamp for debug / testing */
  containerW: number;
  containerH: number;
}

export interface UseAdaptiveCallLayoutOpts {
  count: number;
  /** measured call-stage size */
  width: number;
  height: number;
  gap?: number; // default 12
  minTileW?: number; // default 150  (below this → overflow/pagination)
  minTileH?: number; // default 96
  maxTileH?: number; // default 340 (don't let single tile exceed this — centre instead)
  aspectW?: number; // default 16
  aspectH?: number; // default 9
  controlDockReserve?: number; // bottom safe area for floating dock — default 92
  currentPage?: number; // 0-indexed — for visible slicing
}

// Score helper: area * fill-efficiency, prefer squarer grids
function scoreLayout(
  cols: number,
  rows: number,
  tileW: number,
  tileH: number,
  count: number,
  containerW: number,
  containerH: number,
  gap: number,
) {
  const area = tileW * tileH;
  const usedW = cols * tileW + (cols - 1) * gap;
  const usedH = rows * tileH + (rows - 1) * gap;
  // efficiency: how much of the container is actually used (avoid tiny centred grid)
  const fillW = usedW / Math.max(containerW, 1);
  const fillH = usedH / Math.max(containerH, 1);
  const fillScore = (fillW + fillH) / 2;
  // penalise extreme aspect waste (too many empty cells)
  const emptyCells = cols * rows - count;
  const wastePenalty = emptyCells * 0.08;
  // slight preference for wider grids when close (less vertical scrolling)
  // but don't over-rotate: only small bias.
  const biasScore = cols >= rows ? 0.02 : 0;
  return area * (0.55 + 0.45 * fillScore) * (1 - wastePenalty) + biasScore;
}

export function computeAdaptiveLayout(opts: UseAdaptiveCallLayoutOpts): AdaptiveLayout {
  const {
    count,
    width: rawW,
    height: rawH,
    gap = 12,
    minTileW = 148,
    minTileH = 96,
    maxTileH = 340,
    aspectW = 16,
    aspectH = 9,
    controlDockReserve = 92,
    currentPage = 0,
  } = opts;

  // Reserve bottom dock safe area
  const containerW = Math.max(0, rawW);
  const containerH = Math.max(0, rawH - controlDockReserve);
  const ratio = aspectW / aspectH;

  if (count <= 0 || containerW < 40 || containerH < 40) {
    return {
      columns: 1,
      rows: 1,
      gap,
      tileW: containerW,
      tileH: Math.min(containerH, maxTileH),
      visibleCount: 0,
      totalPages: 1,
      containerW,
      containerH,
    };
  }

  // Single participant — centre, cap height
  if (count === 1) {
    const idealH = Math.min(containerH * 0.88, maxTileH * 1.1, containerW / ratio);
    const idealW = Math.min(containerW * 0.92, idealH * ratio);
    return {
      columns: 1,
      rows: 1,
      gap,
      tileW: Math.round(idealW),
      tileH: Math.round(idealW / ratio),
      visibleCount: 1,
      totalPages: 1,
      containerW,
      containerH,
    };
  }

  // Search all feasible (cols, rows) combos that fit count.
  // Range cols 1..min(count,6) — 6-col max prevents absurd narrow columns.
  // For very large counts we allow more cols but overflow will page.
  const maxColsDense = containerW < 420 ? 2 : containerW < 768 ? 3 : containerW < 1100 ? 4 : containerW < 1600 ? 5 : 6;

  let best: { cols: number; rows: number; tileW: number; tileH: number; score: number } | null = null;

  const maxCols = Math.min(count, maxColsDense);

  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.ceil(count / cols);

    // compute max tile that fits: width-constrained vs height-constrained
    // availableW = containerW - gaps horizontally; same for H
    const availW = containerW - (cols - 1) * gap;
    const availH = containerH - (rows - 1) * gap;
    if (availW <= 0 || availH <= 0) continue;

    // At fixed cols/rows, tileW = availW/cols, tileH = availH/rows — but must keep 16:9
    // So take min of width-driven height and height-driven width
    const wByWidth = availW / cols;
    const hByWidth = wByWidth / ratio;

    const hByHeight = availH / rows;
    const wByHeight = hByHeight * ratio;

    let tileW: number;
    let tileH: number;
    if (hByWidth <= availH / rows) {
      tileW = wByWidth;
      tileH = hByWidth;
    } else {
      tileW = wByHeight;
      tileH = hByHeight;
    }

    // Discard layouts that would make tiles unusably small
    // But keep them as candidates if ALL layouts are too small — pick least-bad
    const isTiny = tileW < minTileW || tileH < minTileH;
    // don't discard yet — score will penalise; only truly reject if there's a better option

    const sc = scoreLayout(cols, rows, tileW, tileH, count, containerW, containerH, gap);
    // apply tiny penalty: keep it but much lower score
    const adjusted = isTiny ? sc * 0.35 : sc;

    if (!best || adjusted > best.score) {
      best = { cols, rows, tileW, tileH, score: adjusted };
    }
  }

  if (!best) {
    // fallback — shouldn't happen
    const cols = Math.min(count, maxColsDense);
    const rows = Math.ceil(count / cols);
    const tileW = (containerW - (cols - 1) * gap) / cols;
    return {
      columns: cols,
      rows,
      gap,
      tileW: Math.round(tileW),
      tileH: Math.round(tileW / ratio),
      visibleCount: count,
      totalPages: 1,
      containerW,
      containerH,
    };
  }

  let { cols, rows, tileW, tileH } = best;

  // Enforce maxTileH: if ideal height > max, shrink width accordingly
  // (except for single row layouts where wider is better)
  if (tileH > maxTileH && rows > 1) {
    tileH = maxTileH;
    tileW = tileH * ratio;
    // if this overflows width, clamp width and recalc height
    const totalW = cols * tileW + (cols - 1) * gap;
    if (totalW > containerW) {
      tileW = (containerW - (cols - 1) * gap) / cols;
      tileH = tileW / ratio;
    }
  }

  // Overflow / pagination:
  // Tiles are considered "usable" only if >= minTileW/minTileH.
  // If our best layout still produces tiny tiles, we paginate.
  const isOverflow = tileW < minTileW || tileH < minTileH;
  let visibleCount = count;
  let totalPages = 1;

  if (isOverflow) {
    // Binary search: find max per-page count that yields usable tiles.
    // Try decreasing perPage from count downwards until layout becomes usable.
    let bestPerPage = 1;
    for (let perPage = count; perPage >= 1; perPage--) {
      // brute: test best layout for perPage
      let bestForN: typeof best | null = null;
      const maxC = Math.min(perPage, maxColsDense);
      for (let c = 1; c <= maxC; c++) {
        const r = Math.ceil(perPage / c);
        const availW2 = containerW - (c - 1) * gap;
        const availH2 = containerH - (r - 1) * gap;
        if (availW2 <= 0 || availH2 <= 0) continue;
        const wW = availW2 / c;
        const hW = wW / ratio;
        const hH = availH2 / r;
        const wH = hH * ratio;
        let tW: number, tH: number;
        if (hW <= availH2 / r) { tW = wW; tH = hW; } else { tW = wH; tH = hH; }
        if (tW < minTileW || tH < minTileH) continue;
        const sc = scoreLayout(c, r, tW, tH, perPage, containerW, containerH, gap);
        if (!bestForN || sc > bestForN.score) bestForN = { cols: c, rows: r, tileW: tW, tileH: tH, score: sc };
      }
      if (bestForN) {
        bestPerPage = perPage;
        // use that layout
        cols = bestForN.cols;
        rows = bestForN.rows;
        tileW = bestForN.tileW;
        tileH = bestForN.tileH;
        break;
      }
    }
    visibleCount = bestPerPage;
    totalPages = Math.ceil(count / visibleCount);
    // If even 1 tile is too tiny (extreme container), force 1 per page and accept tiny
    if (visibleCount === 1 && (tileW < minTileW || tileH < minTileH)) {
      // accept — will be scrollable
      totalPages = count;
    }
  }

  // Ensure page index in bounds
  const safePage = Math.max(0, Math.min(currentPage, Math.max(0, totalPages - 1)));
  // visibleCount already computed; caller slices participants.

  // If paginated, recompute cols/rows for visible slice? Already done via perPage search.
  void safePage;

  return {
    columns: cols,
    rows,
    gap,
    tileW: Math.round(tileW),
    tileH: Math.round(tileH),
    visibleCount,
    totalPages,
    containerW,
    containerH,
  };
}

/** Hook wrapper: measures container via ResizeObserver + runs computeAdaptiveLayout */
export function useAdaptiveCallLayout(
  containerRef: React.RefObject<HTMLElement | null>,
  count: number,
  opts?: Omit<UseAdaptiveCallLayoutOpts, 'count' | 'width' | 'height' | 'currentPage'> & { currentPage?: number },
) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Use clientWidth/Height for inner available (excludes borders/padding already handled via rect but more stable)
    // getBoundingClientRect is fine — we apply box-sizing aware later via CSS padding.
    const w = rect.width;
    const h = rect.height;
    setSize((prev) => (Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }));
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measure();

    let observer: ResizeObserver | null = null;
    // Throttle via rAF to avoid layout thrash on drag-resize
    const onResize = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        measure();
        rafRef.current = null;
      });
    };

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize);
      observer.observe(el);
    } else {
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize as EventListener);
    }

    // Also listen to window resize for fullscreen / chat-drawer transitions
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize as EventListener);
    };
  }, [containerRef, measure]);

  const layout = useMemo(() => {
    return computeAdaptiveLayout({
      count,
      width: size.w,
      height: size.h,
      gap: opts?.gap,
      minTileW: opts?.minTileW,
      minTileH: opts?.minTileH,
      maxTileH: opts?.maxTileH,
      aspectW: opts?.aspectW,
      aspectH: opts?.aspectH,
      controlDockReserve: opts?.controlDockReserve,
      currentPage: opts?.currentPage,
    });
  }, [count, size.w, size.h, opts?.gap, opts?.minTileW, opts?.minTileH, opts?.maxTileH, opts?.aspectW, opts?.aspectH, opts?.controlDockReserve, opts?.currentPage]);

  return { ...layout, measuredW: size.w, measuredH: size.h };
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}
