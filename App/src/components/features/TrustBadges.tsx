import React from 'react';
import { Link } from 'react-router-dom';

export const TrustBadges: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10">
      {/* Trust Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-5 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-2 font-mono font-bold text-xs">
            RFC
          </div>
          <div className="text-xs font-bold text-white font-mono">IETF RFC 9420</div>
          <div className="text-[10px] text-zinc-500 mt-1">Official MLS Standard</div>
        </div>

        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-5 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-mono font-bold text-xs">
            WASM
          </div>
          <div className="text-xs font-bold text-white font-mono">Rust WebAssembly</div>
          <div className="text-[10px] text-zinc-500 mt-1">Memory-Safe Kernel</div>
        </div>

        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-5 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 font-mono font-bold text-xs">
            0-K
          </div>
          <div className="text-xs font-bold text-white font-mono">Zero-Knowledge</div>
          <div className="text-[10px] text-zinc-500 mt-1">Untrusted Relay Router</div>
        </div>

        <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-5 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 font-mono font-bold text-xs">
            OSS
          </div>
          <div className="text-xs font-bold text-white font-mono">MIT / Apache 2.0</div>
          <div className="text-[10px] text-zinc-500 mt-1">100% Verifiable Code</div>
        </div>
      </div>

      {/* Bottom CTA Box */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-red-950/20 to-zinc-950 border border-red-500/30 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent pointer-events-none"></div>

        <h3 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight relative z-10">
          Ready to Experience Cryptographic Privacy?
        </h3>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto relative z-10">
          No signups, no phone numbers, no tracking cookies. Launch an encrypted room or explore the public chat instantly.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
          <Link
            to="/chatbox"
            className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            Launch Secure Chatbox
          </Link>
          <a
            href="https://datatracker.ietf.org/doc/rfc9420/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-xs border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            Read RFC 9420 Spec ↗
          </a>
        </div>
      </div>
    </section>
  );
};
