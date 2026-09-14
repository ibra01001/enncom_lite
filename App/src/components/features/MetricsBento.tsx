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
    sublabel: 'PLAINTEXT: NONE',
    statColor: 'text-[#FF3535]',
    face1Bg: 'bg-[#181818]',
    face2Bg: 'bg-[#242424]',
    imageSrc: docsImg,
    imageAlt: 'Encrypted Documents Archive',
    borderClasses: 'border-r border-b border-[#333333]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20em" height="20em" viewBox="0 0 32 32">
        <path d="M0 0h32v32H0z" fill="none" />
        <path fill="currentColor" d="M25.905 13.71h1.52v15.24h-1.52Zm-1.53 15.24h1.53v1.53h-1.53Zm-16.76 1.53h16.76V32H7.615Zm13.72-28.96h1.52v1.53h-1.52Zm-3.05 18.29h-1.52v-1.52h1.52v-1.53h-4.57v1.53h-1.53v3.04h1.53v1.53h1.52v4.57h1.53v-4.57h1.52v-1.53h1.52v-3.04h-1.52zM10.665 0h10.67v1.52h-10.67Zm-1.52 1.52h1.52v1.53h-1.52Zm16.76 12.19v-1.52h-1.53V3.05h-1.52v9.14H9.145V3.05h-1.53v9.14h-1.52v1.52zM6.095 28.95h1.52v1.53h-1.52Z" />
        <path fill="currentColor" d="M4.575 13.71h1.52v15.24h-1.52Z" />
      </svg>


    ),
    initialDelay: 5000,
  },
  {
    id: 'instant-speed',
    quadrantTag: '02 // LATENCY',
    stat: '< 1ms',
    title: 'Instant Speed',
    description:
      'Everything locks and unlocks locally on your phone or laptop in less than a millisecond. No lag, no waiting.',
    sublabel: 'ENCRYPTION: REALTIME',
    statColor: 'text-white',
    face1Bg: 'bg-[#202020]',
    face2Bg: 'bg-[#2b1b1b]',
    imageSrc: qwerty,
    imageAlt: 'Hardware Cryptographic Keyboard',
    borderClasses: 'border-b border-[#333333]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20em" height="20em" viewBox="0 0 32 32">
        <path d="M0 0h32v32H0z" fill="none" />
        <path fill="currentColor" d="M29.71 8.38h1.53V9.9h-1.53ZM28.19 9.9h1.52v1.53h-1.52Zm0-3.04h1.52v1.52h-1.52Zm-1.52 1.52h1.52V9.9h-1.52Zm0 19.81v-1.53h1.52v-1.52h-1.52v-1.52h-1.53v1.52h-1.52v1.52h1.52v1.53zm-1.53-15.24h1.53V16h-1.53ZM23.62 16h1.52v1.52h-1.52Zm0-12.19h1.52v1.52h-1.52Zm-1.53 13.71h1.53v1.53h-1.53Zm0-12.19h1.53v1.53h-1.53Zm-1.52 13.72h1.52v1.52h-1.52Zm0-12.19h1.52v1.52h-1.52Zm-1.52 13.71h1.52v1.52h-1.52Zm0-12.19h1.52V9.9h-1.52Zm-1.53 21.33h1.53v1.53h-1.53Zm0-7.62h1.53v1.53h-1.53Zm0-12.19v1.53H16v1.52h9.14v-1.52h-6.09V9.9zM16 23.62h1.52v1.52H16Zm9.14-21.34v1.53h1.53V.76H14.48v1.52zM14.48 25.14H16v1.52h-1.52Zm-1.53 1.52h1.53v1.53h-1.53Zm0-24.38h1.53v1.53h-1.53Zm-1.52 25.91h1.52v1.52h-1.52ZM12.95 16H3.81v1.52h7.62v3.05h1.52zM11.43 3.81h1.52v1.52h-1.52ZM9.9 29.71h1.53v1.53H9.9Zm0-9.14h1.53v4.57H9.9Zm0-15.24h1.53v1.53H9.9ZM8.38 25.14H9.9v4.57H8.38Zm0-18.28H9.9v1.52H8.38ZM6.86 8.38h1.52V9.9H6.86ZM5.33 9.9h1.53v1.53H5.33ZM3.81 22.09h1.52v1.53H3.81Zm0-10.66h1.52v1.52H3.81Zm0-10.67v1.52H2.29v1.53h1.52v1.52h1.52V3.81h1.53V2.28H5.33V.76zM2.29 23.62h1.52v1.52H2.29Zm0-3.05h1.52v1.52H2.29Zm0-7.62h1.52V16H2.29ZM.76 22.09h1.53v1.53H.76Z" />
      </svg>


    ),
    initialDelay: 7000,
  },
  {
    id: 'group-chats',
    quadrantTag: '03 // SCALING',
    stat: '50k+',
    title: 'Fast Group Chats',
    description:
      'Whether you are talking with 2 people or 50,000 members, your chat stays just as secure and doesn’t drain your battery.',
    sublabel: 'SCALING: EFFORTLESS',
    statColor: 'text-white',
    face1Bg: 'bg-[#1c1c1c]',
    face2Bg: 'bg-[#272727]',
    imageSrc: treeAuditImg,
    imageAlt: 'TreeKEM Ratchet Topology',
    borderClasses: 'border-r border-[#333333]',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20em" height="20em" viewBox="0 0 32 32">
        <path d="M0 0h32v32H0z" fill="none" />
        <path fill="currentColor" d="M30.48 18.285H32v1.53h-1.52Zm-3.05-1.52h3.05v1.52h-3.05Zm0-3.05h1.52v1.53h-1.52Z" />
        <path fill="currentColor" d="M22.86 15.245v-3.05h-1.52v-1.53h-1.53v-3.04h1.53v-1.53h6.09v1.53h1.52v6.09h1.53v-9.14h-1.53v-1.53h-1.52v-1.52h-6.09v1.52h-1.53v1.53h-1.52v4.57h-4.57v-4.57h-1.53v-1.53h-1.52v-1.52h-6.1v1.52H3.05v1.53H1.53v9.14h1.52v-6.09h1.52v-1.53h6.1v1.53h1.52v3.04h-1.52v1.53H9.15v3.05H4.57v1.52h4.58v6.09h1.52v-7.61h1.52v-1.53h7.62v1.53h1.53v7.61h1.52v-6.09h4.57v-1.52zm1.52 13.71h1.53v1.52h-1.53Zm-1.52-1.52h1.52v1.52h-1.52Zm-3.05-1.53h3.05v1.53h-3.05Zm0-3.05h1.53v1.53h-1.53Z" />
        <path fill="currentColor" d="M18.29 16.765h1.52v3.05h-1.52Zm-6.1 7.62h7.62v1.52h-7.62Zm1.53-3.05h4.57v1.52h-4.57Zm-1.53-4.57h1.53v3.05h-1.53Zm-1.52 6.09h1.52v1.53h-1.52Zm-1.52 3.05h3.04v1.53H9.15Zm-1.53 1.53h1.53v1.52H7.62Zm-1.52 1.52h1.52v1.52H6.1Zm-3.05-15.24h1.52v1.53H3.05Zm-1.52 3.05h3.04v1.52H1.53ZM0 18.285h1.53v1.53H0Z" />
      </svg>

    ),
    initialDelay: 10000,
  },
  {
    id: 'auto-protection',
    quadrantTag: '04 // RECOVERY',
    stat: '100%',
    title: 'Automatic Protection',
    description:
      'Security keys update automatically in the background. Even if a phone is lost or stolen, past and future chats stay secure.',
    sublabel: 'ROTATION: AUTOMATIC',
    statColor: 'text-[#FF3535]',
    face1Bg: 'bg-[#261a1a]',
    face2Bg: 'bg-[#1e1e1e]',
    imageSrc: alxanderBg,
    imageAlt: 'Cryptographic Engine Protocol',
    borderClasses: '',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20em" height="20em" viewBox="0 0 32 32">
        <path d="M0 0h32v32H0z" fill="none" />
        <path fill="currentColor" d="M30.48 16.76H32v12.19h-1.52Zm-1.53 12.19h1.53v1.53h-1.53Zm0-13.71V3.05h-1.52V1.52h-1.52V0h-7.62v1.52h-1.53v1.53h-1.52v12.19h-1.52v1.52h16.76v-1.52Zm-3.04 0h-7.62V4.57h1.52V3.05h4.57v1.52h1.53ZM15.24 30.48h13.71V32H15.24Zm9.14-7.62h1.53v1.52h-1.53Zm0-3.05h1.53v1.52h-1.53Zm-4.57 4.57h4.57v1.52h-4.57Zm-1.52-1.52h1.52v1.52h-1.52Zm0-3.05h1.52v1.52h-1.52Zm-4.57 9.14h1.52v1.53h-1.52Zm-1.53-12.19h1.53v4.57h-1.53Zm-1.52 6.1h1.52v6.09h-1.52Zm-1.52 6.09h1.52v1.53H9.15Zm0-7.62h1.52v1.53H9.15ZM7.62 6.09h1.53v15.24H7.62ZM3.05 30.48h6.1V32h-6.1Zm4.57-7.62H4.57v1.52H3.05v3.05h1.52v1.52h3.05v-1.52h1.53v-3.05H7.62zM4.57 4.57h3.05v1.52H4.57Zm0 12.19H1.53v-1.52h3.04v-4.57H1.53V9.14h3.04V6.09H3.05v1.53H0v4.57h3.05v1.52H0v4.57h3.05v3.05h1.52zM1.53 28.95h1.52v1.53H1.53Z" />
        <path fill="currentColor" d="M1.53 21.33h1.52v1.53H1.53ZM0 22.86h1.53v6.09H0Z" />
      </svg>

    ),
    initialDelay: 4000,
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
        const computedRadius = width / (2 * Math.sqrt(3));
        setRadius(computedRadius);
        if (cubeRef.current) {
          gsap.set(cubeRef.current, { z: -computedRadius });
        }
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
        : 5000 + Math.random() * 3000;

    timerRef.current = setTimeout(() => {
      if (isHoveredRef.current || !cubeRef.current) return;

      angleRef.current -= 120;

      gsap.to(cubeRef.current, {
        rotationY: angleRef.current,
        z: -radius,
        duration: 1,
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
  }, [cube.initialDelay, radius]);

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
      z: -radius,
      duration: 1,
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
          transform: `translateZ(-${radius}px)`,
        }}
      >
        {/* ─── Face 1 (Text: Consistent Symmetrical Inset Padding: 48px–64px) ─── */}
        <div
          className={`absolute inset-0 w-full h-full ${cube.face1Bg} flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 text-left`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(0deg) translateZ(${radius}px)`,
          }}
        >
          {/* Top Meta-Labels (Securely Inset by Padding, Never Clipped) */}
          <div className="flex items-center justify-between w-full pointer-events-none">
            <span className="font-['JetBrains_Mono',monospace] text-[11px] sm:text-xs font-bold text-[#FF3535] tracking-widest uppercase flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3535]" />
              {cube.quadrantTag}
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-[11px] text-zinc-500 uppercase tracking-widest shrink-0">
              {cube.sublabel}
            </span>
          </div>

          {/* Bottom-Left Pinned Content (Fluid Font Scaling, Never Intersects Dividers) */}
          <div className="flex flex-col items-start text-left mt-auto space-y-1.5 sm:space-y-2 pointer-events-none max-w-sm sm:max-w-md lg:max-w-lg">
            <div
              className={`font-['JetBrains_Mono',monospace] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none ${cube.statColor}`}
            >
              {cube.stat}
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-white tracking-tight leading-snug">
              {cube.title}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-zinc-300 leading-relaxed line-clamp-3 md:line-clamp-none">
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
          <div className="transition-transform duration-300 transform group-hover:scale-110 text-[#FF3535]">
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
      {/* ─── Full-Page 2x2 Grid (50vw × 50vh per quadrant, structural "+" hairline cross divider) ─── */}
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 relative z-0">
        {QUADRANTS_DATA.map((cube) => (
          <QuadrantCube key={cube.id} cube={cube} />
        ))}
      </div>
    </section>
  );
};
