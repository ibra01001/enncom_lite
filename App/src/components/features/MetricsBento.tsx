import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import docsImg from '../../assets/high-stack-of-assorted-documents-and-files-photo.jpeg';
import qwerty from '../../assets/QWERTY_keyboard.jpg';
import treeAuditImg from '../../assets/image_from_https_railgun.org_assets_tree_audit.dez3ylxl.png';
import alxanderBg from '../../assets/alxander.svg';

interface CubeQuadrant {
  id: string;
  quadrantTag: string;
  stat: string;
  title: string;
  description: string;
  sublabel: string;
  statColor: string;
  face1Bg: string;
  face2Bg: string;
  imageSrc: string;
  imageAlt: string;
  borderClasses: string;
  sidePadding: string;
  icon: React.ReactNode;
  initialDelay: number;
}

const QUADRANTS_DATA: CubeQuadrant[] = [
  {
    id: 'server-access',
    quadrantTag: '01 // PRIVACY',
    stat: '0 Bytes',
    title: 'Zero Server Access',
    description:
      'Our servers only pass scrambled data between devices. We cannot read your chats, view your photos, or see your keys.',
    sublabel: 'Plaintext: None',
    statColor: 'text-[#FF3535]',
    face1Bg: 'bg-[#181818]',
    face2Bg: 'bg-[#242424]',
    imageSrc: docsImg,
    imageAlt: 'Encrypted Documents Archive',
    borderClasses: 'border-r border-b border-[#333333]',
    sidePadding: 'pl-8 sm:pl-12 md:pl-14 lg:pl-16 pr-4 sm:pr-6 md:pr-8',
    icon: (
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#FF3535]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    initialDelay: 700,
  },
  {
    id: 'instant-speed',
    quadrantTag: '02 // LATENCY',
    stat: '< 1ms',
    title: 'Instant Speed',
    description:
      'Everything locks and unlocks locally on your phone or laptop in less than a millisecond. No lag, no waiting.',
    sublabel: 'Encryption: Realtime',
    statColor: 'text-white',
    face1Bg: 'bg-[#202020]',
    face2Bg: 'bg-[#2b1b1b]',
    imageSrc: qwerty,
    imageAlt: 'Hardware Cryptographic Keyboard',
    borderClasses: 'border-b border-[#333333]',
    sidePadding: 'pl-4 sm:pl-6 md:pl-8 pr-8 sm:pr-12 md:pr-14 lg:pr-16',
    icon: (
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
    initialDelay: 2000,
  },
  {
    id: 'group-chats',
    quadrantTag: '03 // SCALING',
    stat: '50k+',
    title: 'Fast Group Chats',
    description:
      'Whether you are talking with 2 people or 50,000 members, your chat stays just as secure and doesn’t drain your battery.',
    sublabel: 'Scaling: Effortless',
    statColor: 'text-white',
    face1Bg: 'bg-[#1c1c1c]',
    face2Bg: 'bg-[#272727]',
    imageSrc: treeAuditImg,
    imageAlt: 'TreeKEM Ratchet Topology',
    borderClasses: 'border-r border-[#333333]',
    sidePadding: 'pl-8 sm:pl-12 md:pl-14 lg:pl-16 pr-4 sm:pr-6 md:pr-8',
    icon: (
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#FF3535]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
    initialDelay: 3300,
  },
  {
    id: 'auto-protection',
    quadrantTag: '04 // RECOVERY',
    stat: '100%',
    title: 'Automatic Protection',
    description:
      'Security keys update automatically in the background. Even if a phone is lost or stolen, past and future chats stay secure.',
    sublabel: 'Rotation: Automatic',
    statColor: 'text-[#FF3535]',
    face1Bg: 'bg-[#261a1a]',
    face2Bg: 'bg-[#1e1e1e]',
    imageSrc: alxanderBg,
    imageAlt: 'Cryptographic Engine Protocol',
    borderClasses: '',
    sidePadding: 'pl-4 sm:pl-6 md:pl-8 pr-8 sm:pr-12 md:pr-14 lg:pr-16',
    icon: (
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
        />
      </svg>
    ),
    initialDelay: 1400,
  },
];

interface QuadrantCubeProps {
  cube: CubeQuadrant;
}

const QuadrantCube: React.FC<QuadrantCubeProps> = ({ cube }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<number>(140);
  const angleRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef<boolean>(false);

  // Measure quadrant width to set translateZ offset for equilateral 3-sided prism
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // In an equilateral 3-sided prism: r = width / (2 * tan(60°)) = width / (2 * √3)
        setRadius(width / (2 * Math.sqrt(3)));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Independent autonomous idle rotation
  const scheduleNextRotation = (delayOverride?: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay =
      delayOverride !== undefined
        ? delayOverride
        : 2500 + Math.random() * 3000;

    timerRef.current = setTimeout(() => {
      if (isHoveredRef.current || !cubeRef.current) return;

      angleRef.current -= 120;

      gsap.to(cubeRef.current, {
        rotationY: angleRef.current,
        duration: 1.15,
        ease: 'power2.inOut',
        onComplete: () => {
          if (!isHoveredRef.current) {
            scheduleNextRotation();
          }
        },
      });
    }, delay);
  };

  useEffect(() => {
    scheduleNextRotation(cube.initialDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cubeRef.current) gsap.killTweensOf(cubeRef.current);
    };
  }, [cube.initialDelay]);

  // Hover Interaction: Snap immediately to Face 1 (Text)
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!cubeRef.current) return;

    gsap.killTweensOf(cubeRef.current);

    // Face 1 is aligned at 0 mod 360
    const current = angleRef.current;
    const target = Math.round(current / 360) * 360;
    angleRef.current = target;

    gsap.to(cubeRef.current, {
      rotationY: target,
      duration: 0.65,
      ease: 'power2.out',
    });
  };

  // Resume autonomous rotation on mouseleave
  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    scheduleNextRotation(2000 + Math.random() * 2500);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full h-full relative select-none cursor-pointer overflow-hidden ${cube.borderClasses}`}
      style={{
        perspective: '1200px',
      }}
    >
      <div
        ref={cubeRef}
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ─── Face 1 (Text: Pinned bottom-left, responsive sizing) ─── */}
        <div
          className={`absolute inset-0 w-full h-full ${cube.face1Bg} flex flex-col justify-between py-5 sm:py-7 md:py-8 lg:py-10 ${cube.sidePadding} text-left`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(0deg) translateZ(${radius}px)`,
          }}
        >
          {/* Top Label */}
          <div className="flex items-center justify-between w-full">
            <span className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs font-bold text-[#FF3535] tracking-widest uppercase flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3535]" />
              {cube.quadrantTag}
            </span>
            <span className="hidden sm:inline-block font-['JetBrains_Mono',monospace] text-[10px] md:text-[11px] text-zinc-500 uppercase tracking-widest">
              {cube.sublabel}
            </span>
          </div>

          {/* Bottom-Left Pinned Content */}
          <div className="flex flex-col items-start text-left mt-auto space-y-1 sm:space-y-1.5 md:space-y-2">
            <div
              className={`font-['JetBrains_Mono',monospace] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none ${cube.statColor}`}
            >
              {cube.stat}
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-white tracking-tight leading-snug">
              {cube.title}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-zinc-300 max-w-lg leading-relaxed line-clamp-3 md:line-clamp-none">
              {cube.description}
            </p>
          </div>
        </div>

        {/* ─── Face 2 (Icon: Centered SVG icon, solid background, no text) ─── */}
        <div
          className={`absolute inset-0 w-full h-full ${cube.face2Bg} flex items-center justify-center p-6 sm:p-8`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(120deg) translateZ(${radius}px)`,
          }}
        >
          <div className="transition-transform duration-300 transform group-hover:scale-110">
            {cube.icon}
          </div>
        </div>

        {/* ─── Face 3 (Image: Full-bleed background image, no text/icon overlay) ─── */}
        <div
          className="absolute inset-0 w-full h-full bg-[#121212] overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(240deg) translateZ(${radius}px)`,
          }}
        >
          <img
            src={cube.imageSrc}
            alt={cube.imageAlt}
            className="w-full h-full object-cover grayscale opacity-75"
          />
        </div>
      </div>
    </div>
  );
};

export const MetricsBento: React.FC = () => {
  return (
    <section
      id="metrics"
      className="w-full h-[calc(100vh-3.5rem)] flex flex-col relative overflow-hidden bg-[#272727] text-white font-['Hanken_Grotesk',sans-serif] selection:bg-[#FF3535] selection:text-white"
    >
      {/* ─── Full-Page 2x2 Grid (50vw × 50vh per quadrant, "+" hairline cross divider) ─── */}
      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
        {QUADRANTS_DATA.map((cube) => (
          <QuadrantCube key={cube.id} cube={cube} />
        ))}
      </div>
    </section>
  );
};
