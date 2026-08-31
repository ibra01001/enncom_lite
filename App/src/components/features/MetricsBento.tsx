import React from 'react';

export const MetricsBento: React.FC = () => {
  return (
    <section id="metrics" className="grid grid-cols-1 md:grid-cols-12 border-b border-[#333333] bg-[#272727]">
      {/* Large Metric Canvas */}
      <div className="md:col-span-8 border-r-0 md:border-r border-b md:border-b-0 border-[#333333] bg-[#272727] relative overflow-hidden min-h-[420px] flex flex-col justify-center items-center p-8 md:p-12">
        <div className="absolute inset-0 ob-halftone opacity-40"></div>
        <div className="relative z-10 text-center flex flex-col gap-4 items-center">
          <span className="ob-label text-zinc-400 uppercase tracking-[0.2em] font-bold text-xs bg-[#222222] border border-[#333333] px-3 py-1">
            Standard Cryptographic Primitive
          </span>
          <div className="ob-h-xl text-white my-2">
            RFC <span className="text-[#FF3535] text-[52px] md:text-[80px]">9420</span>
          </div>
          <p className="ob-data text-zinc-300 max-w-lg text-center leading-relaxed text-sm">
            IETF Messaging Layer Security standard implemented via client-side Rust WebAssembly.
            Zero-knowledge blind relay. Continuous forward secrecy + post-compromise security.
          </p>
        </div>
      </div>

      {/* Minor Metrics Stack */}
      <div className="md:col-span-4 flex flex-col bg-[#0e0e0e]">
        {/* Metric 1 */}
        <div className="flex-1 border-b border-[#333333] p-8 flex flex-col justify-between group hover:bg-[#1f1f1f] transition-colors">
          <div className="flex justify-between items-start">
            <span className="ob-data text-zinc-300 uppercase">WASM Latency</span>
            <span className="material-symbols-outlined text-[#FF3535]">speed</span>
          </div>
          <div>
            <div className="ob-h-lg text-white">&lt; 1.2ms</div>
            <div className="ob-data text-[#FF3535] mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF3535] inline-block"></span>
              Client-Side Encryption
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex-1 border-b border-[#333333] p-8 flex flex-col justify-between group hover:bg-[#1f1f1f] transition-colors">
          <div className="flex justify-between items-start">
            <span className="ob-data text-zinc-300 uppercase">TreeKEM Scaling</span>
            <span className="material-symbols-outlined text-blue-400">hub</span>
          </div>
          <div>
            <div className="ob-h-lg text-white">O(log N)</div>
            <div className="ob-data text-blue-400 mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              50,000+ Group Members
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex-1 p-8 flex flex-col justify-between group hover:bg-[#1f1f1f] transition-colors">
          <div className="flex justify-between items-start">
            <span className="ob-data text-zinc-300 uppercase">Server Plaintext</span>
            <span className="material-symbols-outlined text-emerald-400">shield_locked</span>
          </div>
          <div>
            <div className="ob-h-lg text-white">0 Bytes</div>
            <div className="ob-data text-emerald-400 mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Zero-Knowledge Relay
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
