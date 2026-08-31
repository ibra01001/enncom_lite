import React from 'react';
import { MetricsBento } from './features/MetricsBento';
import { HowItWorksSteps } from './features/HowItWorksSteps';
import { CryptographicFlow } from './features/CryptographicFlow';
import { SecurityComparison } from './features/SecurityComparison';
import { DevMicrosection } from './features/DevMicrosection';
import '../styles/features.css';

const Features: React.FC = () => {
  return (
    <div className="ob-root w-full h-full overflow-y-auto flex flex-col relative bg-[#272727]">
      {/* ─── Main Content (Global Navbar is rendered at root level in main.tsx) ─── */}
      <main className="flex-1 relative z-10 flex flex-col bg-[#272727]">
        {/* 1. Metric Bento Grid */}
        <MetricsBento />

        {/* 2. How It Works (3-Step Protocol Flow) */}
        <HowItWorksSteps />

        {/* 3. Interactive Packet Inspector */}
        <CryptographicFlow />

        {/* 4. Protocol Security Comparison Table */}
        <SecurityComparison />

        {/* 5. Developer Workbench */}
        <DevMicrosection />
      </main>

      {/* ─── Footer ─── */}
      {/*      <footer className="flex flex-col md:flex-row justify-between items-center ob-wrap py-8 bg-[#272727] border-t border-[#333333] z-20 gap-4">
        <div className="ob-h-md text-lg text-[#FF3535] font-extrabold tracking-wider">ENCCOM</div>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="https://datatracker.ietf.org/doc/rfc9420/" target="_blank" rel="noopener noreferrer" className="ob-nav-link py-0 px-0 text-xs text-zinc-300 hover:text-white">Whitepaper</a>
          <a href="https://github.com/ibra01001/enncom_lite" target="_blank" rel="noopener noreferrer" className="ob-nav-link py-0 px-0 text-xs text-zinc-300 hover:text-white">GitHub</a>
          <Link to="/about" className="ob-nav-link py-0 px-0 text-xs text-zinc-300 hover:text-white">About</Link>
          <a href="#" className="ob-nav-link py-0 px-0 text-xs text-zinc-300 hover:text-white">Network Status</a>
        </div>
        <div className="ob-data text-zinc-400 font-bold text-xs">
          © 2025 ENCCOM PROTOCOL. ENCRYPTED BY DEFAULT.
        </div>
      </footer>*/}
    </div>
  );
};

export default Features;