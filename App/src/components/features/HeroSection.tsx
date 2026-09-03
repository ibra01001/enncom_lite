import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/features.css';

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
    <section className="relative min-h-[85vh] flex-1 flex items-center px-6 md:px-16 border-b border-[#333333] bg-[#272727] ob-grid-bg overflow-hidden">
      {/* Halftone Forest Texture Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `url('https://railgun.org/assets/halftone-forest-menu.BpsjDTJ1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      ></div>

      {/* Animated Arrows on Right Side */}
      <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full z-0 pointer-events-none flex items-center justify-center opacity-60 lg:opacity-100">
        {/*<AnimatedArrows />*/}
      </div>

      {/* Content: Left aligned container */}
      <div className="relative z-10 max-w-6xl mx-auto w-full py-16">
        <div className="lg:w-1/2 flex flex-col items-start text-left space-y-6">
          {/* Statement Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white">
            MESSAGE YOUR FRIENDS <br />
            KEEP YOUR CONVERSATIONS <br />
            <span className="text-[#FF3535] font-bold">
              PRIVATE &amp; SAFE
            </span>
          </h1>

          {/* Substatement */}
          <p className="text-lg max-w-xl leading-relaxed text-zinc-300 font-normal">
            Enccom is a free, end-to-end encrypted messaging app that lets you send messages, photos, videos, and files to your friends and family. It's simple, fast, and secure.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/chatbox" className="ob-btn-accent shadow-lg">
              Start Secure Chat
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <button onClick={handleExplore} className="ob-btn-ghost">
              Explore Architecture
            </button>
          </div>
        </div>
      </div>

      {/* Floating Technical Decorator */}
      <div className="absolute left-12 bottom-6 hidden lg:block ob-data text-zinc-400">
        [SYS_RDY: <span className="text-emerald-400">OK</span>]<br />
        ENC_LVL: <span className="text-white">RFC9420</span><br />
        WASM_CORE: <span className="text-[#FF3535]">ACTIVE</span>
      </div>

      <div className="absolute right-12 bottom-6 hidden lg:block ob-data text-zinc-400 text-right">
        <span className="text-white">MLS_128_DHKEMX25519</span><br />
        <span className="text-white">AES128GCM_SHA256</span><br />
        <span className="text-[#FF3535]">Ed25519_TreeKEM</span>
      </div>
    </section>
  );
};
