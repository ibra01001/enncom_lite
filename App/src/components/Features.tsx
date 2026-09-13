import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MetricsBento } from './features/MetricsBento';
import { HowItWorksSteps } from './features/HowItWorksSteps';
import { CryptographicFlow } from './features/CryptographicFlow';
import { SecurityComparison } from './features/SecurityComparison';
import { DevMicrosection } from './features/DevMicrosection';
import '../styles/features.css';

interface SectionItem {
  id: string;
  number: string;
  title: string;
  component: React.ReactNode;
}

const SECTIONS: SectionItem[] = [
  {
    id: 'metrics',
    number: '01',
    title: 'Architecture & Benchmarks',
    component: <MetricsBento />,
  },
  {
    id: 'how-it-works',
    number: '02',
    title: 'Protocol Pipeline',
    component: <HowItWorksSteps />,
  },
  {
    id: 'packet-inspector',
    number: '03',
    title: 'Packet Inspector',
    component: <CryptographicFlow />,
  },
  {
    id: 'comparison',
    number: '04',
    title: 'Security Comparison',
    component: <SecurityComparison />,
  },
  {
    id: 'developer',
    number: '05',
    title: 'Developer Workbench',
    component: <DevMicrosection />,
  },
];

const Features: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastTransitionTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const goToSection = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, SECTIONS.length - 1));
    setActiveSection(clamped);
    const target = SECTIONS[clamped];
    if (target && window.location.hash !== `#${target.id}`) {
      window.history.replaceState(null, '', `#${target.id}`);
    }
  }, []);

  const nextSection = useCallback(() => {
    setActiveSection((prev) => {
      const next = Math.min(prev + 1, SECTIONS.length - 1);
      const target = SECTIONS[next];
      if (target && window.location.hash !== `#${target.id}`) {
        window.history.replaceState(null, '', `#${target.id}`);
      }
      return next;
    });
  }, []);

  const prevSection = useCallback(() => {
    setActiveSection((prev) => {
      const prevIdx = Math.max(prev - 1, 0);
      const target = SECTIONS[prevIdx];
      if (target && window.location.hash !== `#${target.id}`) {
        window.history.replaceState(null, '', `#${target.id}`);
      }
      return prevIdx;
    });
  }, []);

  // Reset scroll position to top when section changes
  useEffect(() => {
    const el = sectionRefs.current[activeSection];
    if (el) {
      el.scrollTop = 0;
    }
  }, [activeSection]);

  // Handle URL hash changes and custom navigation events from Navbar
  useEffect(() => {
    const syncFromHash = (targetId?: string) => {
      const hashId = targetId || window.location.hash.replace(/^#/, '');
      if (hashId) {
        const foundIndex = SECTIONS.findIndex((s) => s.id === hashId);
        if (foundIndex !== -1) {
          setActiveSection(foundIndex);
        }
      }
    };

    syncFromHash();

    const onCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      syncFromHash(customEvent.detail);
    };

    window.addEventListener('hashchange', () => syncFromHash());
    window.addEventListener('features-goto-section', onCustomNav);

    return () => {
      window.removeEventListener('hashchange', () => syncFromHash());
      window.removeEventListener('features-goto-section', onCustomNav);
    };
  }, []);

  // Scroll hijack: allow internal scrolling if section overflows, jump sections at boundaries
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const activeEl = sectionRefs.current[activeSection];
      if (activeEl) {
        const maxScrollTop = activeEl.scrollHeight - activeEl.clientHeight;
        const isScrollable = maxScrollTop > 20;

        if (isScrollable) {
          const isAtBottom = activeEl.scrollTop >= maxScrollTop - 15;
          const isAtTop = activeEl.scrollTop <= 15;

          // If scrolling down and not yet at bottom of current section, let it scroll naturally
          if (e.deltaY > 0 && !isAtBottom) {
            return;
          }
          // If scrolling up and not yet at top of current section, let it scroll naturally
          if (e.deltaY < 0 && !isAtTop) {
            return;
          }
        }
      }

      // At boundary or content fits within viewport: prevent default and switch section
      e.preventDefault();

      const now = Date.now();
      // Cooldown resistance to absorb trackpad momentum
      if (now - lastTransitionTime.current < 700) {
        return;
      }

      if (Math.abs(e.deltaY) < 20) {
        return;
      }

      lastTransitionTime.current = now;

      if (e.deltaY > 0) {
        nextSection();
      } else {
        prevSection();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const activeEl = sectionRefs.current[activeSection];
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;

      if (activeEl) {
        const maxScrollTop = activeEl.scrollHeight - activeEl.clientHeight;
        const isScrollable = maxScrollTop > 20;
        if (isScrollable) {
          const isAtBottom = activeEl.scrollTop >= maxScrollTop - 15;
          const isAtTop = activeEl.scrollTop <= 15;
          if (deltaY > 0 && !isAtBottom) return;
          if (deltaY < 0 && !isAtTop) return;
        }
      }

      if (Math.abs(deltaY) > 40) {
        const now = Date.now();
        if (now - lastTransitionTime.current < 700) return;
        lastTransitionTime.current = now;

        if (deltaY > 0) {
          nextSection();
        } else {
          prevSection();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = sectionRefs.current[activeSection];
      if (activeEl) {
        const maxScrollTop = activeEl.scrollHeight - activeEl.clientHeight;
        const isScrollable = maxScrollTop > 20;

        if (isScrollable) {
          const isAtBottom = activeEl.scrollTop >= maxScrollTop - 15;
          const isAtTop = activeEl.scrollTop <= 15;

          if (['ArrowDown', 'PageDown', ' '].includes(e.key) && !isAtBottom) {
            return;
          }
          if (['ArrowUp', 'PageUp'].includes(e.key) && !isAtTop) {
            return;
          }
        }
      }

      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastTransitionTime.current < 450) return;
        lastTransitionTime.current = now;
        nextSection();
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastTransitionTime.current < 450) return;
        lastTransitionTime.current = now;
        prevSection();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSection, nextSection, prevSection]);

  return (
    <div
      ref={containerRef}
      className="ob-root w-full h-full relative overflow-hidden bg-[#272727] select-none text-[#e5e2e1]"
    >
      {/* ─── Main Content Area (Full width & height, cross-fade transitions) ─── */}
      <main className="w-full h-full relative overflow-hidden">
        {SECTIONS.map((section, idx) => {
          const isActive = activeSection === idx;

          return (
            <div
              key={section.id}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              className={`absolute inset-0 w-full h-full overflow-y-auto ${
                section.id === 'metrics' ? 'px-0' : 'px-4 sm:px-12 md:px-14'
              } transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? 'opacity-100 scale-100 pointer-events-auto z-20'
                  : 'opacity-0 scale-[0.98] pointer-events-none z-10'
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="w-full min-h-full flex flex-col justify-start">
                {section.component}
              </div>
            </div>
          );
        })}
      </main>

      {/* ─── Left Vertical Sidebar (Transparent overlay ON TOP of components) ─── */}
      <aside
        aria-label="Left Section Indicator"
        className="absolute top-0 left-0 bottom-0 w-10 z-40 border-r border-white/10 flex flex-col items-center justify-between py-6 sm:py-8 pointer-events-none select-none bg-transparent"
      >
        {/* Navigation Ticks */}
        <div className="flex flex-col mt-55 items-center gap-3 pointer-events-auto">
          {SECTIONS.map((sec, idx) => {
            const isCurrent = activeSection === idx;
            return (
              <button
                key={sec.id}
                onClick={() => goToSection(idx)}
                className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-none"
                aria-label={`Jump to section ${sec.number}: ${sec.title}`}
              >
                <span
                  className={`block transition-all duration-300 rounded-none ${isCurrent
                    ? 'w-1 h-34 bg-[#FF3535]'
                    : 'w-1 h-8 bg-white/20 hover:bg-white/50'
                    }`}
                />
              </button>
            );
          })}
        </div>
      </aside>

      {/* ─── Right Vertical Sidebar (Transparent overlay ON TOP of components) ─── */}
      <aside
        aria-label="Right Section Indicator"
        className="absolute top-0 right-0 bottom-0 w-10 z-40 border-l border-white/10 flex flex-col items-center justify-between py-6 sm:py-8 pointer-events-none select-none bg-transparent"
      >
        {/* Mirrored Indicator */}
        <div className="flex flex-col items-center mt-55 gap-3">
          {SECTIONS.map((sec, idx) => {
            const isCurrent = activeSection === idx;
            return (
              <span
                key={sec.id}
                className={`block transition-all duration-300 rounded-none ${isCurrent
                  ? 'w-1 h-34 bg-[#FF3535]'
                  : 'w-1 h-8 bg-white/20'
                  }`}
              />
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default Features;