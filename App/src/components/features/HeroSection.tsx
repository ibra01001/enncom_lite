import React from 'react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  onScrollDown: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollDown }) => {
  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center px-4 md:px-16 border-b border-[#333333] bg-[#272727] ob-grid-bg overflow-hidden">
      {/* Halftone Forest Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: `url('https://railgun.org/assets/halftone-forest-menu.BpsjDTJ1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center gap-8 py-16">
        {/* Status Badge */}

        {/* Statement Headline */}
        <h1 className="ob-h-xl text-white tracking-tight">
          Privacy with <br /> <span className="text-[#FF3535]">No Compromises.</span>
        </h1>

        {/* Substatement */}
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-normal">
          Battle-tested OpenMLS end-to-end encryption compiled to WebAssembly. Non-custodial by design: no admin keys, no plaintext logs, and zero metadata tracking. Encrypted by default.
        </p>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link to="/chatbox" className="ob-btn-accent shadow-lg">
            Start Secure Chat
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          <button onClick={onScrollDown} className="ob-btn-ghost">
            Explore Architecture
          </button>
        </div>
      </div>

      {/* Floating Technical Decorator */}
      <div className="absolute left-12 bottom-8 hidden lg:block ob-data text-zinc-400">
        [SYS_RDY: <span className="text-emerald-400">OK</span>]<br />
        ENC_LVL: <span className="text-white">RFC9420</span><br />
        WASM_CORE: <span className="text-[#FF3535]">ACTIVE</span>
      </div>

      <div className="absolute right-12 bottom-8 hidden lg:block ob-data text-zinc-400 text-right">
        <span className="text-white">MLS_128_DHKEMX25519</span><br />
        <span className="text-white">AES128GCM_SHA256</span><br />
        <span className="text-[#FF3535]">Ed25519_TreeKEM</span>
      </div>
    </section>
  );
};
