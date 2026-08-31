import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface HeroCarouselProps {
  onScrollToDocs?: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onScrollToDocs }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'latency' | 'scaling' | 'entropy'>('latency');
  const [countersStarted, setCountersStarted] = useState(false);
  const totalSlides = 3;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statGridRef = useRef<HTMLDivElement | null>(null);

  // Auto advance
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 7000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    resetTimer();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    resetTimer();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    resetTimer();
  };

  // Count-up trigger when slide 2 is visible
  useEffect(() => {
    if (currentSlide === 2) {
      setCountersStarted(true);
    }
  }, [currentSlide]);

  return (
    <section className="feat-hero">
      <div className="feat-hero-frame">
        {/* Carousel Header Index & Controls */}
        <div className="feat-hero-index">
          <span className="font-mono-feat text-xs text-zinc-500">
            0{currentSlide + 1} / 0{totalSlides}
          </span>
          <div className="feat-carousel-controls">
            <button
              onClick={prevSlide}
              className="feat-carousel-btn"
              aria-label="Previous slide"
            >
              <svg className="feat-icon" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="feat-carousel-dots">
              {[0, 1, 2].map((idx) => (
                <span
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`feat-carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                />
              ))}
            </div>
            <button
              onClick={nextSlide}
              className="feat-carousel-btn"
              aria-label="Next slide"
            >
              <svg className="feat-icon" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slides Container */}
        <div className="feat-slides">
          {/* SLIDE 0: Centered Statement */}
          <div className={`feat-slide ${currentSlide === 0 ? 'active' : ''}`}>
            <div className="feat-slide-statement">
              <span className="feat-badge">
                <span className="feat-badge-dot"></span>
                Zero-knowledge, zero compromise
              </span>

              <h1 className="feat-statement-title">
                Private, battle-tested group messaging with{' '}
                <span className="feat-icon-inline">
                  <svg className="feat-icon" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>{' '}
                OpenMLS.
              </h1>

              <p className="feat-substatement">
                Zero-knowledge by design: no{' '}
                <span className="feat-icon-inline">
                  <svg className="feat-icon" viewBox="0 0 24 24">
                    <circle cx="8" cy="15" r="4" />
                    <path d="M11 12l9-9M17 6l2 2M14 9l2 2" />
                  </svg>
                </span>{' '}
                admin keys, no{' '}
                <span className="feat-icon-inline">
                  <svg className="feat-icon" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </span>{' '}
                plaintext logs, and no{' '}
                <span className="feat-icon-inline">
                  <svg className="feat-icon" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>{' '}
                metadata tracking.
              </p>

              <div className="feat-cta-row">
                <Link to="/chatbox" className="feat-btn-primary">
                  <span>Launch Secure Chat</span>
                  <svg className="feat-icon" viewBox="0 0 24 24">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </Link>
                <button
                  onClick={onScrollToDocs}
                  className="feat-btn-ghost"
                >
                  Explore Architecture
                </button>
              </div>
            </div>
          </div>

          {/* SLIDE 1: Protocol Metrics Dashboard */}
          <div className={`feat-slide ${currentSlide === 1 ? 'active' : ''}`}>
            <div className="feat-slide-metrics">
              <div className="feat-metrics-visual">
                <div className="feat-bracket-shape"></div>
              </div>
              <div className="feat-metrics-panel">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Protocol performance
                </h2>

                <div className="feat-tabs">
                  <button
                    onClick={() => setActiveTab('latency')}
                    className={`feat-tab ${activeTab === 'latency' ? 'active' : ''}`}
                  >
                    WASM Latency
                  </button>
                  <button
                    onClick={() => setActiveTab('scaling')}
                    className={`feat-tab ${activeTab === 'scaling' ? 'active' : ''}`}
                  >
                    TreeKEM Scaling
                  </button>
                  <button
                    onClick={() => setActiveTab('entropy')}
                    className={`feat-tab ${activeTab === 'entropy' ? 'active' : ''}`}
                  >
                    Epoch Ratchet
                  </button>
                </div>

                <div className="feat-legend">
                  <span className="feat-legend-item">
                    <span className="feat-swatch" style={{ background: 'var(--feat-accent)' }}></span>
                    WASM Latency
                  </span>
                  <span className="feat-legend-item">
                    <span className="feat-swatch" style={{ background: 'var(--feat-data-blue)' }}></span>
                    TreeKEM Depth
                  </span>
                  <span className="feat-legend-item">
                    <span className="feat-swatch" style={{ background: 'var(--feat-data-green)' }}></span>
                    Entropy Bits
                  </span>
                </div>

                <div className="feat-chart-wrap">
                  <svg viewBox="0 0 640 240" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                    {/* Grid lines */}
                    <line className="feat-grid-line" x1="60" y1="220" x2="620" y2="220" />
                    <line className="feat-grid-line" x1="60" y1="172" x2="620" y2="172" />
                    <line className="feat-grid-line" x1="60" y1="124" x2="620" y2="124" />
                    <line className="feat-grid-line" x1="60" y1="76" x2="620" y2="76" />
                    <line className="feat-grid-line" x1="60" y1="28" x2="620" y2="28" />

                    {/* Y Axis */}
                    <text className="feat-axis-label" x="12" y="223">0</text>
                    <text className="feat-axis-label" x="8" y="175">10</text>
                    <text className="feat-axis-label" x="8" y="127">50</text>
                    <text className="feat-axis-label" x="4" y="79">100</text>
                    <text className="feat-axis-label" x="4" y="31">256</text>

                    {/* X Axis */}
                    <text className="feat-axis-label" x="60" y="236">N=10</text>
                    <text className="feat-axis-label" x="192" y="236">N=100</text>
                    <text className="feat-axis-label" x="328" y="236">N=1k</text>
                    <text className="feat-axis-label" x="463" y="236">N=10k</text>
                    <text className="feat-axis-label" x="580" y="236">N=50k</text>

                    {/* Polylines */}
                    <polyline
                      className={`feat-chart-line ${activeTab !== 'latency' ? 'dim' : ''}`}
                      stroke="var(--feat-accent)"
                      points="70,210 205,208 340,205 475,200 610,195"
                    />
                    <polyline
                      className={`feat-chart-line ${activeTab !== 'scaling' ? 'dim' : ''}`}
                      stroke="var(--feat-data-blue)"
                      points="70,215 205,190 340,150 475,90 610,35"
                    />
                    <polyline
                      className={`feat-chart-line ${activeTab !== 'entropy' ? 'dim' : ''}`}
                      stroke="var(--feat-data-green)"
                      points="70,40 205,38 340,35 475,32 610,30"
                    />

                    {/* Dots */}
                    <g opacity={activeTab === 'latency' ? '1' : '0.2'}>
                      <circle cx="70" cy="210" r="3.5" fill="var(--feat-accent)" />
                      <circle cx="205" cy="208" r="3.5" fill="var(--feat-accent)" />
                      <circle cx="340" cy="205" r="3.5" fill="var(--feat-accent)" />
                      <circle cx="475" cy="200" r="3.5" fill="var(--feat-accent)" />
                      <circle cx="610" cy="195" r="3.5" fill="var(--feat-accent)" />
                    </g>
                    <g opacity={activeTab === 'scaling' ? '1' : '0.2'}>
                      <circle cx="70" cy="215" r="3.5" fill="var(--feat-data-blue)" />
                      <circle cx="205" cy="190" r="3.5" fill="var(--feat-data-blue)" />
                      <circle cx="340" cy="150" r="3.5" fill="var(--feat-data-blue)" />
                      <circle cx="475" cy="90" r="3.5" fill="var(--feat-data-blue)" />
                      <circle cx="610" cy="35" r="3.5" fill="var(--feat-data-blue)" />
                    </g>
                    <g opacity={activeTab === 'entropy' ? '1' : '0.2'}>
                      <circle cx="70" cy="40" r="3.5" fill="var(--feat-data-green)" />
                      <circle cx="205" cy="38" r="3.5" fill="var(--feat-data-green)" />
                      <circle cx="340" cy="35" r="3.5" fill="var(--feat-data-green)" />
                      <circle cx="475" cy="32" r="3.5" fill="var(--feat-data-green)" />
                      <circle cx="610" cy="30" r="3.5" fill="var(--feat-data-green)" />
                    </g>
                  </svg>
                </div>
                <div className="feat-chart-caption">
                  Source: OpenMLS RFC 9420 client benchmarks (WebAssembly in V8 runtime)
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 2: Split Stat Panel with Count-Up */}
          <div className={`feat-slide ${currentSlide === 2 ? 'active' : ''}`}>
            <div className="feat-slide-split">
              <div className="feat-split-left">
                <h2>Private access, plainly stated.</h2>
                <p>
                  Communicate, group chat, and stream media without broadcasting your encryption keys or identity to any centralized relay.
                </p>
                <div className="feat-cta-row justify-start">
                  <Link to="/chatbox" className="feat-btn-primary">
                    <span>Use Enccom</span>
                    <svg className="feat-icon" viewBox="0 0 24 24">
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </Link>
                  <button onClick={onScrollToDocs} className="feat-btn-ghost">
                    Read OpenMLS Spec
                  </button>
                </div>
              </div>

              <div className="feat-stat-grid" ref={statGridRef}>
                <div className="feat-stat-cell">
                  <div className="feat-stat-value text-red-400">
                    {countersStarted ? '< 1.2' : '0.0'}
                    <span className="text-base text-zinc-500 font-normal ml-1">ms</span>
                  </div>
                  <div className="feat-stat-label">
                    <span className="feat-swatch" style={{ background: 'var(--feat-accent)' }}></span>
                    WASM Encryption Overhead
                  </div>
                </div>

                <div className="feat-stat-cell">
                  <div className="feat-stat-value text-amber-400">
                    {countersStarted ? '50.0' : '0.0'}
                    <span className="text-base text-zinc-500 font-normal ml-1">K</span>
                  </div>
                  <div className="feat-stat-label">
                    <span className="feat-swatch" style={{ background: 'var(--feat-data-amber)' }}></span>
                    Max Group Scalability O(log N)
                  </div>
                </div>

                <div className="feat-stat-cell">
                  <div className="feat-stat-value text-blue-400">
                    {countersStarted ? '256' : '0'}
                    <span className="text-base text-zinc-500 font-normal ml-1">bit</span>
                  </div>
                  <div className="feat-stat-label">
                    <span className="feat-swatch" style={{ background: 'var(--feat-data-blue)' }}></span>
                    ChaCha20 / Ed25519 Security
                  </div>
                </div>

                <div className="feat-stat-cell">
                  <div className="feat-stat-value text-emerald-400">
                    {countersStarted ? '0.0' : '0.0'}
                    <span className="text-base text-zinc-500 font-normal ml-1">B</span>
                  </div>
                  <div className="feat-stat-label">
                    <span className="feat-swatch" style={{ background: 'var(--feat-data-green)' }}></span>
                    Server Plaintext Access
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
