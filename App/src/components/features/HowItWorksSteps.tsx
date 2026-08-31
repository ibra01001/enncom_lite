import React from 'react';

export const HowItWorksSteps: React.FC = () => {
  return (
    <section id="how-it-works" className="ob-section bg-[#272727]">
      <div className="ob-wrap">
        <div className="flex items-baseline justify-between py-16 flex-wrap gap-4">
          <div>
            <h2 className="ob-h-md text-white" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>
              How it works
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Three-stage zero-trust cryptographic pipeline.
            </p>
          </div>
          <a
            href="https://datatracker.ietf.org/doc/rfc9420/"
            target="_blank"
            rel="noopener noreferrer"
            className="ob-label text-[#FF3535] hover:text-white transition-colors inline-flex items-center gap-1.5 font-bold"
          >
            Read RFC 9420 Docs
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 border-t border-[#333333] bg-[#272727]"
        style={{
          maxWidth: 'var(--ob-maxw)',
          margin: '0 auto',
          borderLeft: '1px solid #333333',
          borderRight: '1px solid #333333',
        }}
      >
        {/* Step 1 */}
        <div className="p-10 border-b md:border-b-0 md:border-r border-[#333333] hover:bg-[#1c1c1c] transition-colors">
          <div className="ob-data text-zinc-400 mb-6 font-bold">01 — PREKEYS</div>
          <div className="h-24 flex items-center mb-6 relative">
            <div
              className="w-20 h-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #71717a 1.2px, transparent 1.5px)',
                backgroundSize: '14px 14px',
                clipPath: 'polygon(0 0, 100% 0, 100% 24%, 34% 24%, 34% 76%, 100% 76%, 100% 100%, 0 100%)',
                opacity: 0.7,
              }}
            ></div>
          </div>
          <h3 className="ob-h-md text-xl text-white mb-3">Publish KeyPackages</h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            Generate signed HPKE prekey packages inside browser WASM memory. The relay stores only an encrypted invitation mailbox — nothing more.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-10 border-b md:border-b-0 md:border-r border-[#333333] hover:bg-[#1c1c1c] transition-colors">
          <div className="ob-data text-[#FF3535] mb-6 font-bold">02 — TREEKEM</div>
          <div className="h-24 flex items-center mb-6 relative">
            <div
              className="w-20 h-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #FF3535 1.4px, transparent 1.6px)',
                backgroundSize: '10px 10px',
                clipPath: 'polygon(0 0, 100% 0, 100% 24%, 34% 24%, 34% 76%, 100% 76%, 100% 100%, 0 100%)',
                opacity: 1,
              }}
            ></div>
          </div>
          <h3 className="ob-h-md text-xl text-white mb-3">Ratchet Group Epochs</h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            Propose and commit group updates into the encrypted Ratchet Tree. Continuous forward secrecy and post-compromise security are mathematically guaranteed.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-10 hover:bg-[#1c1c1c] transition-colors">
          <div className="ob-data text-emerald-400 mb-6 font-bold">03 — TRANSACT</div>
          <div className="h-24 flex items-center mb-6 relative">
            <div
              className="w-20 h-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #10B981 1.4px, transparent 1.6px)',
                backgroundSize: '8px 8px',
                clipPath: 'polygon(0 0, 100% 0, 100% 24%, 34% 24%, 34% 76%, 100% 76%, 100% 100%, 0 100%)',
                opacity: 1,
              }}
            ></div>
            <div className="absolute left-[26px] top-[32px] w-7 h-7 rounded-none bg-[#FF3535] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontSize: '16px' }}>check</span>
            </div>
          </div>
          <h3 className="ob-h-md text-xl text-white mb-3">Zero-Knowledge Relay</h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            Messages and media stream through untrusted WebSocket relays. The blind server relays raw cipher bytes with zero decryption capability.
          </p>
        </div>
      </div>
    </section>
  );
};
