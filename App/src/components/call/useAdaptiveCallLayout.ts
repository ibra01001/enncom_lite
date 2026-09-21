import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export interface AdaptiveLayout {
  columns: number; rows: number; gap: number;
  tileW: number; tileH: number;
  visibleCount: number; totalPages: number;
  containerW: number; containerH: number;
}

interface Opts {
  count: number; width: number; height: number;
  gap?: number; minTileW?: number; minTileH?: number;
  maxTileH?: number; aspectW?: number; aspectH?: number;
  controlDockReserve?: number; currentPage?: number;
}

const score = (cols: number, rows: number, w: number, h: number, n: number, W: number, H: number, gap: number) => {
  const area = w * h;
  const fill = ((cols * w + (cols - 1) * gap) / Math.max(W, 1) + (rows * h + (rows - 1) * gap) / Math.max(H, 1)) / 2;
  return area * (0.55 + 0.45 * fill) * (1 - (cols * rows - n) * 0.08) + (cols >= rows ? 0.02 : 0);
};

export function computeAdaptiveLayout({
  count, width: rawW, height: rawH,
  gap = 12, minTileW = 148, minTileH = 96, maxTileH = 340,
  aspectW = 16, aspectH = 9, controlDockReserve = 92,
}: Opts): AdaptiveLayout {
  const W = Math.max(0, rawW);
  const H = Math.max(0, rawH - controlDockReserve);
  const ratio = aspectW / aspectH;

  if (!count || W < 40 || H < 40) {
    return { columns: 1, rows: 1, gap, tileW: W, tileH: Math.min(H, maxTileH), visibleCount: 0, totalPages: 1, containerW: W, containerH: H };
  }
  if (count === 1) {
    const h = Math.min(H * 0.88, maxTileH * 1.1, W / ratio);
    const w = Math.min(W * 0.92, h * ratio);
    return { columns: 1, rows: 1, gap, tileW: Math.round(w), tileH: Math.round(w / ratio), visibleCount: 1, totalPages: 1, containerW: W, containerH: H };
  }

  const maxCols = Math.min(count, W < 420 ? 2 : W < 768 ? 3 : W < 1100 ? 4 : W < 1600 ? 5 : 6);
  let best: { cols: number; rows: number; w: number; h: number; s: number } | null = null;

  const tileFor = (cols: number, rows: number) => {
    const availW = W - (cols - 1) * gap, availH = H - (rows - 1) * gap;
    if (availW <= 0 || availH <= 0) return null;
    const wByW = availW / cols, hByW = wByW / ratio;
    const hByH = availH / rows, wByH = hByH * ratio;
    return hByW <= availH / rows ? { w: wByW, h: hByW } : { w: wByH, h: hByH };
  };

  for (let c = 1; c <= maxCols; c++) {
    const r = Math.ceil(count / c);
    const t = tileFor(c, r);
    if (!t) continue;
    const tiny = t.w < minTileW || t.h < minTileH;
    const s = score(c, r, t.w, t.h, count, W, H, gap) * (tiny ? 0.35 : 1);
    if (!best || s > best.s) best = { cols: c, rows: r, w: t.w, h: t.h, s };
  }
  if (!best) {
    const cols = maxCols, rows = Math.ceil(count / cols);
    const w = (W - (cols - 1) * gap) / cols;
    return { columns: cols, rows, gap, tileW: Math.round(w), tileH: Math.round(w / ratio), visibleCount: count, totalPages: 1, containerW: W, containerH: H };
  }

  let { cols, rows, w, h } = best;

  if (h > maxTileH && rows > 1) {
    h = maxTileH; w = h * ratio;
    if (cols * w + (cols - 1) * gap > W) { w = (W - (cols - 1) * gap) / cols; h = w / ratio; }
  }

  if (w >= minTileW && h >= minTileH) {
    return { columns: cols, rows, gap, tileW: Math.round(w), tileH: Math.round(h), visibleCount: count, totalPages: 1, containerW: W, containerH: H };
  }

  // paginate: find largest perPage that fits without tiny tiles
  for (let per = count; per >= 1; per--) {
    let bestN: typeof best | null = null;
    for (let c = 1; c <= Math.min(per, maxCols); c++) {
      const r = Math.ceil(per / c);
      const t = tileFor(c, r);
      if (!t || t.w < minTileW || t.h < minTileH) continue;
      const s = score(c, r, t.w, t.h, per, W, H, gap);
      if (!bestN || s > bestN.s) bestN = { cols: c, rows: r, w: t.w, h: t.h, s };
    }
    if (bestN) return { columns: bestN.cols, rows: bestN.rows, gap, tileW: Math.round(bestN.w), tileH: Math.round(bestN.h), visibleCount: per, totalPages: Math.ceil(count / per), containerW: W, containerH: H };
  }
  return { columns: cols, rows, gap, tileW: Math.round(w), tileH: Math.round(h), visibleCount: 1, totalPages: count, containerW: W, containerH: H };
}

export function useAdaptiveCallLayout(
  ref: React.RefObject<HTMLElement | null>,
  count: number,
  opts?: Omit<Opts, 'count' | 'width' | 'height'>,
) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const raf = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    setSize(p => (Math.abs(p.w - w) < 1 && Math.abs(p.h - h) < 1 ? p : { w, h }));
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const onResize = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => { measure(); raf.current = null; });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener('resize', onResize);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, [ref, measure]);

  return useMemo(() => ({
    ...computeAdaptiveLayout({ count, width: size.w, height: size.h, ...opts }),
    measuredW: size.w, measuredH: size.h,
  }), [count, size.w, size.h, opts]);
}

export function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return m;
}
