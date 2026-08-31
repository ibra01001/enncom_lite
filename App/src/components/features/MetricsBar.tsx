import React from 'react';

export const MetricsBar: React.FC = () => {
  const metrics = [
    {
      value: '< 1.2ms',
      label: 'WASM Overhead',
      desc: 'Native Rust speed in browser',
      accent: 'text-emerald-400',
    },
    {
      value: 'RFC 9420',
      label: 'MLS Standard',
      desc: 'IETF standard for group E2EE',
      accent: 'text-red-400',
    },
    {
      value: 'O(log N)',
      label: 'TreeKEM Scaling',
      desc: 'Scales to 50k+ group members',
      accent: 'text-cyan-400',
    },
    {
      value: '0 Bytes',
      label: 'Plaintext Stored',
      desc: 'Zero server visibility or logs',
      accent: 'text-amber-400',
    },
    {
      value: '256-bit',
      label: 'Security Level',
      desc: 'Ed25519 + ChaCha20Poly1305',
      accent: 'text-purple-400',
    },
  ];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {metrics.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-colors backdrop-blur-md"
          >
            <div>
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${item.accent}`}>
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-zinc-200 mt-1">
                {item.label}
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-3">
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
