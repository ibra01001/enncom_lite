import React from 'react';

export const SecurityComparison: React.FC = () => {
  const rows = [
    { feature: 'Protocol Standard', enccom: 'RFC 9420 (MLS)', signal: 'Signal Protocol', matrix: 'Olm/Megolm', wire: 'MLS (partial)', enccomHighlight: true },
    { feature: 'Execution Environment', enccom: 'Browser WASM', signal: 'Native Binary', matrix: 'JavaScript', wire: 'Native Binary', enccomHighlight: true },
    { feature: 'Forward Secrecy', enccom: 'Continuous', signal: 'Per-Message', matrix: 'Per-Session', wire: 'Per-Message', enccomHighlight: true },
    { feature: 'Post-Compromise Security', enccom: 'Per Epoch', signal: 'None', matrix: 'None', wire: 'Partial', enccomHighlight: true },
    { feature: 'Group Key Agreement', enccom: 'TreeKEM O(log N)', signal: 'Pairwise O(N²)', matrix: 'Megolm Shared', wire: 'TreeKEM', enccomHighlight: true },
    { feature: 'Server Plaintext Access', enccom: '0 bytes', signal: 'Metadata', matrix: 'Metadata', wire: 'Metadata', enccomHighlight: true },
    { feature: 'Admin / Master Key', enccom: 'None', signal: 'Key Escrow', matrix: 'Homeserver', wire: 'Corporate Key', enccomHighlight: true },
    { feature: 'Max Group Size', enccom: '50,000+', signal: '1,000', matrix: '10,000', wire: 'Unknown', enccomHighlight: false },
  ];

  return (
    <section id="comparison" className="ob-section bg-[#272727]">
      <div className="ob-wrap py-16">
        <div className="flex items-baseline justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="ob-h-md text-white" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>
              Protocol comparison
            </h2>
            <p className="text-sm text-zinc-300 mt-2">
              Enccom versus incumbent encrypted communication architectures.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-[#333333] bg-[#272727]">
        <table className="ob-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th className="w-[220px]">Security Dimension</th>
              <th>
                <span className="text-[#FF3535] font-extrabold text-sm">Enccom</span>
              </th>
              <th>Signal</th>
              <th>Matrix / Element</th>
              <th>Wire</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-[#1c1c1c] transition-colors">
                <td className="text-zinc-400 font-semibold">{row.feature}</td>
                <td className={row.enccomHighlight ? 'ob-highlight' : 'text-white font-bold'}>
                  {row.enccom}
                </td>
                <td className="text-zinc-300">{row.signal}</td>
                <td className="text-zinc-300">{row.matrix}</td>
                <td className="text-zinc-300">{row.wire}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
