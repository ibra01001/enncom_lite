import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== '/features') {
      navigate('/features');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-20 bg-[#272727] border-b border-[#333333] px-4 md:px-12 flex items-center justify-between select-none">
      {/* Brand */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight hover:opacity-90 transition-opacity font-mono">
          <Logo />
          <span>ENCCOM</span>
        </Link>

        {/* Desktop Navigation with Brutalist Halftone Dropdowns */}
        <nav className="hidden lg:flex items-center gap-2">
          {/* Direct Nav Item */}
          <Link
            to="/features"
            className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded transition-colors"
          >
            Features
          </Link>

          {/* Docs Dropdown */}
          <div className="relative group">
            <button className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] px-3 py-2 rounded flex items-center gap-1 transition-all">
              <span>Docs</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu Panel with Halftone Right Column */}
            <div className="absolute top-full left-0 hidden group-hover:flex w-[420px] bg-[#272727] border border-[#333333] rounded z-50 shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex-grow p-4 flex flex-col gap-2 bg-[#272727]">
                <span className="ob-mono text-[11px] font-bold uppercase tracking-widest text-[#FF3535] mb-1">
                  Architecture &amp; Specs
                </span>
                <a
                  href="https://datatracker.ietf.org/doc/rfc9420/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ob-mono text-xs text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>RFC 9420 Specification</span>
                  <span className="text-[10px] text-zinc-500 font-bold">IETF</span>
                </a>
                <button
                  onClick={() => handleScrollTo('how-it-works')}
                  className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>TreeKEM Protocol Flow</span>
                  <span className="text-[10px] text-[#FF3535] font-bold">O(log N)</span>
                </button>
                <button
                  onClick={() => handleScrollTo('packet-inspector')}
                  className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>Live Packet Inspector</span>
                  <span className="text-[10px] text-emerald-400 font-bold">SIM</span>
                </button>
              </div>

              {/* Halftone Image Right Column */}
              <div className="w-28 border-l border-[#333333] bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
                <img
                  src="https://railgun.org/assets/tree-audit.Dez3ylXl.png"
                  alt="Audit Halftone"
                  className="h-full w-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 ob-halftone opacity-50 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Developers Dropdown */}
          <div className="relative group">
            <button className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] px-3 py-2 rounded flex items-center gap-1 transition-all">
              <span>Developers</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform">
                expand_more
              </span>
            </button>

            <div className="absolute top-full left-0 hidden group-hover:flex w-[420px] bg-[#272727] border border-[#333333] rounded z-50 shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex-grow p-4 flex flex-col gap-2 bg-[#272727]">
                <span className="ob-mono text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-1">
                  Developer Resources
                </span>
                <button
                  onClick={() => handleScrollTo('developer')}
                  className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>WASM Integration Workbench</span>
                  <span className="text-[10px] text-blue-400 font-bold">RUST</span>
                </button>
                <a
                  href="https://github.com/ibra01001/enncom_lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ob-mono text-xs text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>GitHub Repository</span>
                  <span className="text-[10px] text-zinc-500 font-bold">OPEN SOURCE</span>
                </a>
                <button
                  onClick={() => handleScrollTo('comparison')}
                  className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"
                >
                  <span>Security Matrix &amp; Audit</span>
                  <span className="text-[10px] text-zinc-500 font-bold">BENCHMARK</span>
                </button>
              </div>

              {/* Halftone Image Right Column */}
              <div className="w-28 border-l border-[#333333] bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
                <img
                  src="https://railgun.org/assets/tree-audit.Dez3ylXl.png"
                  alt="Dev Halftone"
                  className="h-full w-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 ob-halftone opacity-50 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* About Link */}
          <Link
            to="/about"
            className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded transition-colors"
          >
            About
          </Link>
        </nav>
      </div>

      {/* Right Action */}
      <div className="flex items-center gap-3">
        <Link
          to="/chatbox"
          className="ob-btn-accent text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded"
        >
          <span>Secure Chat</span>
          <span className="material-symbols-outlined text-[16px]">security</span>
        </Link>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-zinc-300 hover:text-white p-2 border border-[#333333] bg-[#1e1e1e] rounded"
        >
          <span className="material-symbols-outlined text-[20px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#272727] border-b border-[#333333] p-4 flex flex-col gap-2.5 shadow-2xl z-50">
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="ob-mono text-sm font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            Features
          </Link>
          <button
            onClick={() => handleScrollTo('how-it-works')}
            className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            Protocol Flow
          </button>
          <button
            onClick={() => handleScrollTo('packet-inspector')}
            className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            Packet Inspector
          </button>
          <button
            onClick={() => handleScrollTo('developer')}
            className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            Developers &amp; WASM
          </button>
          <button
            onClick={() => handleScrollTo('comparison')}
            className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            Security Comparison
          </button>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="ob-mono text-sm font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]"
          >
            About
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
