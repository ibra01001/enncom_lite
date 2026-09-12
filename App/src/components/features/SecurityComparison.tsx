import React from 'react';

export const SecurityComparison: React.FC = () => {
  const rows = [
    {
      criterion: 'Encrypted chat',
      enccom: 'E2EE using MLS',
      discord: 'Normal text chat is not E2EE',
      telegram: 'E2EE only in Secret Chats',
      whatsapp: 'E2EE',
      signal: 'E2EE',
    },
    {
      criterion: 'Encrypted group chat',
      enccom: 'MLS group encryption',
      discord: 'Normal text groups are not E2EE',
      telegram: 'Normal groups are cloud chats',
      whatsapp: 'E2EE',
      signal: 'E2EE',
    },
    {
      criterion: 'Group encryption technology',
      enccom: 'MLS / RFC 9420',
      discord: 'Discord systems',
      telegram: 'MTProto',
      whatsapp: 'Signal-based protocol',
      signal: 'Signal Protocol',
    },
    {
      criterion: 'Server receives plaintext messages',
      enccom: 'No',
      discord: 'Yes for normal text',
      telegram: 'Yes for normal cloud chats',
      whatsapp: 'No',
      signal: 'No',
    },
    {
      criterion: 'Account required',
      enccom: 'No',
      discord: 'Yes',
      telegram: 'Yes',
      whatsapp: 'Yes',
      signal: 'Yes',
    },
    {
      criterion: 'Phone number required',
      enccom: 'No',
      discord: 'No',
      telegram: 'Yes',
      whatsapp: 'Yes',
      signal: 'Yes',
    },
    {
      criterion: 'Temporary identity',
      enccom: 'Yes',
      discord: 'No',
      telegram: 'No',
      whatsapp: 'No',
      signal: 'No',
    },
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

        </div>

        {/* Seamless Integrated Comparison Table (No Cards, Part of the Web) */}
        <div className="border-y border-white/10 overflow-x-auto relative z-10 mt-8">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#1c1b1b]/40 border-b border-white/10">
                <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/10">
                  Criterion
                </th>
                <th className="py-5 px-6 border-r border-white/10 bg-[#161616] relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#FF3535]"></div>
                  <span className="font-['JetBrains_Mono',monospace] text-[14px] font-bold text-[#FF3535] tracking-widest uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    ENCCOM
                  </span>
                </th>
                <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/10">
                  Discord
                </th>
                <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/10">
                  Telegram
                </th>
                <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase border-r border-white/10">
                  WhatsApp
                </th>
                <th className="py-5 px-6 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] tracking-widest uppercase">
                  Signal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-['JetBrains_Mono',monospace]">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="py-5 px-6 text-[13px] text-[#e5e2e1] font-semibold border-r border-white/10">
                    {row.criterion}
                  </td>
                  <td className="py-5 px-6 text-[14px] border-r border-white/10 bg-[#FF3535]/[0.03] relative">
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-[#FF3535]/40"></div>
                    <span className="text-white font-bold tracking-tight">
                      {row.enccom}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-[13px] text-zinc-400 border-r border-white/10">
                    {row.discord}
                  </td>
                  <td className="py-5 px-6 text-[13px] text-zinc-400 border-r border-white/10">
                    {row.telegram}
                  </td>
                  <td className="py-5 px-6 text-[13px] text-zinc-400 border-r border-white/10">
                    {row.whatsapp}
                  </td>
                  <td className="py-5 px-6 text-[13px] text-zinc-400">
                    {row.signal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
