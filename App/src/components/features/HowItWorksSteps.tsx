import React from 'react';
import treeAuditImg from '../../assets/image_from_https_railgun.org_assets_tree_audit.dez3ylxl.png';

export const HowItWorksSteps: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="bg-[#272727] text-[#e5e2e1] font-['Hanken_Grotesk',sans-serif] relative overflow-hidden border-t border-white/10 selection:bg-[#FF3535] selection:text-white"
    >
      {/* Background SVG Noise Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Halftone Forest Texture Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-luminosity z-0"
        style={{
          backgroundImage: `url('https://railgun.org/assets/halftone-forest-menu.BpsjDTJ1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'contrast(140%) brightness(80%)',
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 relative z-10 pt-16 md:pt-20">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-12 border-b border-white/10">
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#FF3535] tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF3535]" />
              PROTOCOL PIPELINE
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-[64px] leading-tight md:leading-[72px] font-extrabold tracking-[-0.04em] text-[#e5e2e1]">
              How it works
            </h2>
            <p className="text-base sm:text-[18px] leading-[28px] text-[#c7c4d7] mt-2 font-normal">
              Three-stage zero-trust cryptographic pipeline.
            </p>
          </div>

        </div>
      </div>

      {/* Seamless Integrated 3-Column Flow (No Cards, Seamless Part of the Page) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 relative z-10 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Step 1 */}
          <div className="py-10 md:pr-10 lg:pr-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="font-['JetBrains_Mono',monospace] text-xs font-bold text-zinc-400 tracking-widest uppercase">
                  01 — PREKEYS
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-[#FF3535] uppercase tracking-wider">
                  RFC 9420 §7
                </div>
              </div>

              {/* Seamless Tree Audit Graphic Lens */}
              <div className="relative border-l-2 border-[#FF3535] bg-[#1a1a1a]/60 border-y border-r border-white/5 overflow-hidden mb-6 h-40">
                <img
                  src={treeAuditImg}
                  alt="Tree Audit - Leaf Prekeys"
                  className="w-full h-full object-cover object-bottom filter contrast-125 brightness-90 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-3 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#FF3535]" />
                  LEAF INGESTION // DHKEM-X25519
                </div>
              </div>

              <h3 className="text-xl md:text-[22px] font-bold text-[#e5e2e1] tracking-tight mb-3">
                Publish KeyPackages
              </h3>
              <p className="text-sm leading-relaxed text-[#c7c4d7]">
                Generate signed HPKE prekey packages inside browser WASM memory. The relay stores only an encrypted invitation mailbox — nothing more.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 font-['JetBrains_Mono',monospace] text-[11px] text-zinc-500 flex justify-between">
              <span>STORAGE</span>
              <span className="text-zinc-400">CLIENT WASM</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="py-10 md:px-10 lg:px-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#FF3535] tracking-widest uppercase">
                  02 — TREEKEM
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-[#FF3535] uppercase tracking-wider">
                  O(log N)
                </div>
              </div>

              {/* Seamless Tree Audit Graphic Lens */}
              <div className="relative border-l-2 border-[#FF3535] bg-[#1a1a1a]/60 border-y border-r border-white/5 overflow-hidden mb-6 h-40">
                <img
                  src={treeAuditImg}
                  alt="Tree Audit - Ratchet Direct Path"
                  className="w-full h-full object-cover object-center filter contrast-125 brightness-90 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-3 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#FF3535]" />
                  DIRECT PATH // RATCHET TREE
                </div>
              </div>

              <h3 className="text-xl md:text-[22px] font-bold text-[#e5e2e1] tracking-tight mb-3">
                Ratchet Group Epochs
              </h3>
              <p className="text-sm leading-relaxed text-[#c7c4d7]">
                Propose and commit group updates into the encrypted Ratchet Tree. Continuous forward secrecy and post-compromise security are mathematically guaranteed.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 font-['JetBrains_Mono',monospace] text-[11px] text-zinc-500 flex justify-between">
              <span>SECRECY</span>
              <span className="text-[#FF3535]">CONTINUOUS</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="py-10 md:pl-10 lg:pl-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="font-['JetBrains_Mono',monospace] text-xs font-bold text-emerald-400 tracking-widest uppercase">
                  03 — TRANSACT
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[11px] text-[#10B981] uppercase tracking-wider">
                  0 BYTES ACCESS
                </div>
              </div>

              {/* Seamless Tree Audit Graphic Lens */}
              <div className="relative border-l-2 border-[#10B981] bg-[#1a1a1a]/60 border-y border-r border-white/5 overflow-hidden mb-6 h-40">
                <img
                  src={treeAuditImg}
                  alt="Tree Audit - Root Verification"
                  className="w-full h-full object-cover object-top filter contrast-125 brightness-90 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-3 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#10B981]" />
                  MERKLE ROOT // BLIND RELAY
                </div>
              </div>

              <h3 className="text-xl md:text-[22px] font-bold text-[#e5e2e1] tracking-tight mb-3">
                Zero-Knowledge Relay
              </h3>
              <p className="text-sm leading-relaxed text-[#c7c4d7]">
                Messages and media stream through untrusted WebSocket relays. The blind server relays raw cipher bytes with zero decryption capability.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 font-['JetBrains_Mono',monospace] text-[11px] text-zinc-500 flex justify-between">
              <span>PAYLOAD</span>
              <span className="text-[#10B981]">CIPHERTEXT ONLY</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


