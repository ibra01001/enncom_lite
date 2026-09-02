import React from 'react';

export const SecurityComparison: React.FC = () => {
  const rows = [
    { feature: 'Protocol Standard', enccom: 'RFC 9420 (MLS)', signal: 'Signal Protocol', matrix: 'Olm/Megolm', wire: 'MLS (partial)' },
    { feature: 'Execution Environment', enccom: 'Browser WASM', signal: 'Native Binary', matrix: 'JavaScript', wire: 'Native Binary' },
    { feature: 'Forward Secrecy', enccom: 'Continuous', signal: 'Per-Message', matrix: 'Per-Session', wire: 'Per-Message' },
    { feature: 'Post-Compromise Security', enccom: 'Per Epoch', signal: 'None', matrix: 'None', wire: 'Partial' },
    { feature: 'Group Key Agreement', enccom: 'TreeKEM O(log N)', signal: 'Pairwise O(N²)', matrix: 'Megolm Shared', wire: 'TreeKEM' },
    { feature: 'Server Plaintext Access', enccom: '0 bytes', signal: 'Metadata', matrix: 'Metadata', wire: 'Metadata' },
    { feature: 'Admin / Master Key', enccom: 'None', signal: 'Key Escrow', matrix: 'Homeserver', wire: 'Corporate Key' },
    { feature: 'Max Group Size', enccom: '50,000+', signal: '1,000', matrix: '10,000', wire: 'Unknown' },
  ];

  return (
    <section id="comparison" className="bg-[#272727] text-[#e5e2e1] py-16 font-['Hanken_Grotesk',sans-serif] relative overflow-hidden selection:bg-[#FF3535] selection:text-white border-t border-white/10">
      {/* Background SVG Noise Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`
        }}
      ></div>

      {/* Halftone Forest Texture Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-luminosity z-0"
        style={{
          backgroundImage: `url('https://railgun.org/assets/halftone-forest-menu.BpsjDTJ1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'contrast(140%) brightness(80%)'
        }}
      ></div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 relative z-10">
        <div className="mb-10 border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-4xl sm:text-5xl leading-tight font-extrabold tracking-[-0.04em] text-[#e5e2e1]">
              Protocol Comparison
            </h2>
            <p className="text-base sm:text-[18px] leading-[28px] text-[#c7c4d7] mt-2 font-normal">
              Enccom versus incumbent encrypted communication architectures.
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-400 flex items-center gap-2 bg-[#1c1b1b] border border-white/10 px-3 py-1.5 rounded">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>SEC_AUDIT_MATRIX</span>
          </div>
        </div>

        <div className="relative bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded shadow-2xl overflow-hidden mt-8 group">
          {/* Subtle gradient overlay on hover for the table container */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#1c1b1b]/50 border-b border-white/10">
                  <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/5">
                    Security Dimension
                  </th>
                  <th className="py-5 px-6 border-r border-white/5 bg-[#1c1b1b] relative overflow-hidden">
                     {/* Enccom Header Highlight */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-[#FF3535]"></div>
                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#FF3535]/10 rounded-full blur-xl pointer-events-none"></div>
                     <span className="font-['JetBrains_Mono',monospace] text-[15px] font-bold text-[#FF3535] tracking-widest uppercase flex items-center gap-2 relative z-10">
                       <span className="material-symbols-outlined text-[18px]">verified_user</span>
                       Enccom
                     </span>
                  </th>
                  <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/5">
                    Signal
                  </th>
                  <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/5">
                    Matrix / Element
                  </th>
                  <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase">
                    Wire
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-['JetBrains_Mono',monospace]">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-5 px-6 text-[13px] text-[#e5e2e1] font-semibold border-r border-white/5">
                      {row.feature}
                    </td>
                    <td className="py-5 px-6 text-[14px] border-r border-white/5 bg-[#FF3535]/[0.04] relative">
                      {/* Left border highlight for Enccom cells */}
                      <div className="absolute top-0 left-0 w-0.5 h-full bg-[#FF3535]/40"></div>
                      <span className="text-white font-bold tracking-tight">
                        {row.enccom}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-[13px] text-zinc-400 border-r border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                      {row.signal}
                    </td>
                    <td className="py-5 px-6 text-[13px] text-zinc-400 border-r border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                      {row.matrix}
                    </td>
                    <td className="py-5 px-6 text-[13px] text-zinc-400 opacity-80 hover:opacity-100 transition-opacity">
                      {row.wire}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
