import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import Logo from './Logo';
import docsImg from './../assets/alxander3.svg';
import qwerty from './../assets/alxander-2.svg';
const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chatbox');

  const menuRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('features-goto-section', { detail: id }));
    if (window.location.pathname !== '/features') {
      navigate(`/features#${id}`);
    } else {
      window.location.hash = id;
    }
  };

  // GSAP — same power2.inOut as Rooms sidebar (verbal: sidebar power2.inOut)
  useEffect(() => {
    const el = menuRef.current;
    const bd = backdropRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) {
      gsap.set(el, { clearProps: 'transform,opacity' });
      el.style.pointerEvents = '';
      if (bd) gsap.set(bd, { clearProps: 'opacity' });
      return;
    }
    if (mobileMenuOpen) {
      gsap.fromTo(el, { y: '-8%', opacity: 0 }, { y: '0%', opacity: 1, duration: 0.38, ease: 'power2.inOut' });
      el.style.pointerEvents = 'auto';
      if (bd) {
        bd.style.pointerEvents = 'auto';
        gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      }
    } else {
      gsap.to(el, { y: '-8%', opacity: 0, duration: 0.32, ease: 'power2.inOut' });
      el.style.pointerEvents = 'none';
      if (bd) {
        gsap.to(bd, { opacity: 0, duration: 0.22, ease: 'power2.in' });
        setTimeout(() => { if (!mobileMenuOpen && bd) bd.style.pointerEvents = 'none'; }, 320);
      }
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const el = menuRef.current;
    const bd = backdropRef.current;
    if (!el) return;
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        gsap.set(el, { clearProps: 'transform,opacity' });
        el.style.pointerEvents = '';
        if (bd) {
          gsap.set(bd, { clearProps: 'opacity' });
          bd.style.pointerEvents = 'none';
        }
      } else if (!mobileMenuOpen) {
        gsap.set(el, { y: '-8%', opacity: 0 });
        el.style.pointerEvents = 'none';
        if (bd) {
          gsap.set(bd, { opacity: 0 });
          bd.style.pointerEvents = 'none';
        }
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full h-14 bg-[#272727] border-b border-[#333333] px-3 sm:px-4 md:px-12 flex items-center justify-between select-none gap-2">
      {/* Brand */}
      <div className="flex items-center gap-4 sm:gap-8 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-xl tracking-tight hover:opacity-90 transition-opacity font-mono">
          <Logo />
          <span>ENCCOM</span>
        </Link>

        {/* Desktop Navigation with Brutalist Halftone Dropdowns */}
        <nav className="hidden lg:flex items-center gap-2">
          <Link to="/features" className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded transition-colors">Features</Link>
          <div className="relative group">
            <button className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] px-3 py-2 rounded flex items-center gap-1 transition-all">
              <span>Docs</span><span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform">expand_more</span>
            </button>
            <div className="absolute top-full left-0 hidden group-hover:flex w-[420px] bg-[#272727] border border-[#333333] rounded z-50 shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex-grow p-4 flex flex-col gap-2 bg-[#272727]">
                <span className="ob-mono text-[11px] font-bold uppercase tracking-widest text-[#FF3535] mb-1">Architecture &amp; Specs</span>
                <a href="https://datatracker.ietf.org/doc/rfc9420/" target="_blank" rel="noopener noreferrer" className="ob-mono text-xs text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>RFC 9420 Specification</span><span className="text-[10px] text-zinc-500 font-bold">IETF</span></a>
                <button onClick={() => handleScrollTo('how-it-works')} className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>TreeKEM Protocol Flow</span><span className="text-[10px] text-[#FF3535] font-bold">O(log N)</span></button>
                <button onClick={() => handleScrollTo('packet-inspector')} className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>Live Packet Inspector</span><span className="text-[10px] text-emerald-400 font-bold">SIM</span></button>
              </div>
              <div className="w-28 border-l border-[#333333] bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
                <img src={docsImg} alt="Docs Files" className="h-full w-full object-cover grayscale opacity-60 hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 ob-halftone opacity-100 pointer-events"></div>
              </div>
            </div>
          </div>
          <div className="relative group">
            <button className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#1f1f1f] px-3 py-2 rounded flex items-center gap-1 transition-all">
              <span>Developers</span><span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-white group-hover:rotate-180 transition-transform">expand_more</span>
            </button>
            <div className="absolute top-full left-0 hidden group-hover:flex w-[420px] bg-[#272727] border border-[#333333] rounded z-50 shadow-2xl overflow-hidden animate-in fade-in duration-150">
              <div className="flex-grow p-4 flex flex-col gap-2 bg-[#272727]">
                <span className="ob-mono text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-1">Developer Resources</span>
                <button onClick={() => handleScrollTo('developer')} className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>WASM Integration Workbench</span><span className="text-[10px] text-blue-400 font-bold">RUST</span></button>
                <a href="https://github.com/ibra01001/enncom_lite" target="_blank" rel="noopener noreferrer" className="ob-mono text-xs text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>GitHub Repository</span><span className="text-[10px] text-zinc-500 font-bold">OPEN SOURCE</span></a>
                <button onClick={() => handleScrollTo('comparison')} className="ob-mono text-xs text-left text-zinc-200 hover:text-white hover:bg-[#222222] p-2 rounded flex items-center justify-between transition-colors"><span>Security Matrix &amp; Audit</span><span className="text-[10px] text-zinc-500 font-bold">BENCHMARK</span></button>
              </div>
              <div className="w-28 border-l border-[#333333] bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
                <img src={qwerty} alt="Dev Halftone" className="h-full w-full object-cover opacity-60 hover:opacity-100 transition-opacity" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                <div className="absolute inset-0 ob-halftone opacity-100 pointer-events"></div>
              </div>
            </div>
          </div>
          <Link to="/about" className="ob-mono text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded transition-colors">About</Link>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {!isChat && (
          <Link to="/chatbox" className="ob-btn-accent text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 rounded px-3 py-2 sm:px-5 whitespace-nowrap shrink-0">
            <span className="hidden min-[360px]:inline">Secure Chat</span><span className="min-[360px]:hidden">Chat</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" className="sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M20 2H4v2h16zm0 14H6v2h14zm2-12h-2v12h2zM4 4H2v18h2zm2 14H4v2h2zm0-6h4v2H6zm0-4h8v2H6z" /></svg>
          </Link>
        )}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-zinc-400 hover:text-white p-1.5 hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-[22px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile backdrop — same as sidebar */}
      <div ref={backdropRef} onClick={() => setMobileMenuOpen(false)} className="lg:hidden fixed inset-0 top-14 bg-black/60 backdrop-blur-[1px] opacity-0 pointer-events-none z-40" />

      {/* Mobile Drawer Menu — GSAP animated same as Rooms sidebar */}
      <div
        ref={menuRef}
        className="lg:hidden absolute top-full left-0 w-full bg-[#272727] border-b border-[#333333] p-4 flex flex-col gap-2.5 shadow-2xl z-50 opacity-0 pointer-events-none"
        style={{ transform: 'translateY(-8%)' }}
      >
        <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="ob-mono text-sm font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">Features</Link>
        <button onClick={() => handleScrollTo('how-it-works')} className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">Protocol Flow</button>
        <button onClick={() => handleScrollTo('packet-inspector')} className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">Packet Inspector</button>
        <button onClick={() => handleScrollTo('developer')} className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">Developers &amp; WASM</button>
        <button onClick={() => handleScrollTo('comparison')} className="ob-mono text-sm text-left font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">Security Comparison</button>
        <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="ob-mono text-sm font-semibold text-zinc-200 hover:text-white p-2 rounded hover:bg-[#222222]">About</Link>
      </div>
    </header>
  );
};

export default Navbar;
