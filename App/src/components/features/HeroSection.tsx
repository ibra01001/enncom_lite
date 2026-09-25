import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/features.css';
import alxanderBg from '../../assets/alxander.svg';

interface HeroSectionProps {
  onScrollDown?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollDown }) => {
  const navigate = useNavigate();

  const handleExplore = () => {
    if (onScrollDown) {
      onScrollDown();
    } else {
      navigate('/features');
    }
  };

  return (
    <section className="relative flex-1 min-h-0 flex items-center w-full min-h-[calc(100vh-3.5rem)] supports-[height:100dvh]:min-h-[calc(100dvh-3.5rem)] border-b border-[#333333] bg-[#272727] ob-grid-bg overflow-hidden lg:overflow-visible">
      {/* Full-page SVG Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${alxanderBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          height: '110vh',
        }}
      ></div>

      {/* Content container — fluid max-width + responsive padding for all PC sizes */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex items-center px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-20 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 2xl:py-20 min-h-[calc(100vh-3.5rem)] supports-[height:100dvh]:min-h-[calc(100dvh-3.5rem)]">
        {/* Left column — fluid width */}
        <div className="w-full max-w-[640px] sm:max-w-[600px] md:max-w-[640px] lg:max-w-[560px] xl:max-w-[680px] 2xl:max-w-[760px] flex flex-col items-start text-left gap-5 sm:gap-6 md:gap-6 xl:gap-7 2xl:gap-8 hero-content">
          {/* Statement Headline — fluid clamp across 1024 → 2560 */}
          <h1
            className="hero-title font-extrabold tracking-[-0.04em] leading-[0.9] text-white
              text-[clamp(2.4rem,9vw,3.1rem)]
              sm:text-[clamp(3rem,7.5vw,4rem)]
              md:text-[clamp(3.5rem,6.8vw,4.75rem)]
              lg:text-[clamp(3.2rem,4.6vw,4.85rem)]
              xl:text-[clamp(4.2rem,4.8vw,5.85rem)]
              2xl:text-[clamp(5rem,5vw,6.75rem)]"
            style={{ fontFamily: 'Hanken Grotesk, system-ui, sans-serif' }}
          >
            PRIVET <br /> CONVERSATIONS
          </h1>

          {/* Substatement — fluid */}
          <p className="text-[15px] sm:text-[16px] md:text-[17px] lg:text-[16px] xl:text-[17px] 2xl:text-[18px] leading-[1.6] text-zinc-300 font-normal max-w-[36rem] lg:max-w-[30rem] xl:max-w-[36rem] 2xl:max-w-[40rem] pr-2 lg:pr-0 text-balance">
            Enccom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It&apos;s simple, fast, and secure.
          </p>

          {/* CTA Row — kept original position/padding */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/chatbox" className=" shadow-lg">
              <button
                className="group relative flex h-14 w-64 items-center justify-between bg-[#ff3535] pl-6 pr-0 overflow-hidden rounded"
              >
                <span
                  className="absolute inset-y-0 right-0 w-0 bg-[#1e1e1e] transition-all duration-300 ease-in-out group-hover:w-full"
                ></span>

                <span
                  className="relative z-10 font-sans  font-bold font-[#ff3535] tracking-wider text-white transition-colors duration-300 group-hover:text-[#ff3535]"
                >
                  START CHATTING
                </span>

                <span
                  className="relative z-10 flex h-full w-14 items-center justify-center bg-white text-[#ff3535]"
                >
                  <svg
                    className="h-5 w-5 -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </span>
              </button>

            </Link>
            <button onClick={handleExplore} className="ob-btn-ghost">
              Explore Architecture
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
