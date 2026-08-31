import React, { useState } from 'react';

export const CryptographicFlow: React.FC = () => {
  const [inputText, setInputText] = useState('{"type": "transfer", "asset": "ETH", "amount": "1.5", "destination": "0x..."}');
  const [epoch, setEpoch] = useState(49201);
  const [copied, setCopied] = useState(false);
  const [logExported, setLogExported] = useState(false);

  const generateMockHex = (str: string, ep: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i) + ep * 31;
      hash |= 0;
    }
    const hexChars = '0123456789abcdef';
    let hex = '0x4e6f77206973207468652074696d6520666f7220616c6c20676f6f64206d656e20746f20636f6d6520746f2074686520616964206f6620746865697220636f756e7472792e204e6f77206973207468652074696d65';
    for (let i = 0; i < 32; i++) {
      const cc = (Math.abs(hash) + i * 17 + (str.charCodeAt(i % (str.length || 1)) || 42)) % 16;
      hex += hexChars[cc];
    }
    return hex + '...';
  };

  const cipherHex = generateMockHex(inputText, epoch);

  const handleCopy = () => {
    navigator.clipboard.writeText(cipherHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLog = () => {
    const logData = `[ENCCOM PACKET INSPECTOR LOG]
Timestamp: ${new Date().toISOString()}
System Epoch: ${epoch}
Ratchet State: SYNCED
Signature: Ed25519 Valid
Source: ALICE
Plaintext: ${inputText}
Ciphertext: ${cipherHex}
Terminus: BOB (Verified)`;
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enccom_packet_epoch_${epoch}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLogExported(true);
    setTimeout(() => setLogExported(false), 2000);
  };

  return (
    <section id="packet-inspector" className="bg-[#272727] text-[#e5e2e1] min-h-screen font-['Hanken_Grotesk',sans-serif] relative overflow-hidden border-t border-white/10 selection:bg-[#FF3535] selection:text-white">
      {/* Background SVG Noise Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`
        }}
      ></div>

      {/* Halftone Forest Texture Layer (Railgun-style Encrypted Depth) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14] mix-blend-luminosity z-0"
        style={{
          backgroundImage: `url('https://railgun.org/assets/halftone-forest-menu.BpsjDTJ1.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'contrast(140%) brightness(80%)'
        }}
      ></div>

      {/* Terminal Header */}
      <header className="w-full border-b border-white/10 bg-[#272727]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full px-4 sm:px-8 md:px-16 py-4 max-w-[1440px] mx-auto font-['JetBrains_Mono',monospace] text-[14px] leading-[20px]">
          <div className="flex items-center gap-6 mb-3 md:mb-0">
            <span className="text-[#FF3535] font-bold tracking-tight">ENCCOM // TERMINAL</span>
            <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
            <span className="text-[#c7c4d7] flex items-center gap-2 text-xs sm:text-sm">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              v2.4.0-rc1
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[#c7c4d7] text-xs sm:text-sm">
            <button
              onClick={() => setEpoch((e) => e + 1)}
              className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group rounded px-1.5 py-0.5 hover:bg-white/5"
              title="Click to advance ratchet epoch"
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>System Epoch: <strong className="text-white font-mono">{epoch}</strong></span>
              <span className="text-[10px] text-[#FF3535] opacity-0 group-hover:opacity-100 transition-opacity font-bold">[+1]</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">sync_alt</span>
              <span>Ratchet State: <strong className="text-[#10B981]">SYNCED</strong></span>
            </div>
            <div className="flex items-center gap-2 sm:border-l border-white/10 sm:pl-6">
              <span className="material-symbols-outlined text-[14px]">security</span>
              <span className="text-[#e5e2e1]">Network: <strong className="text-[#10B981]">SECURE</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Asymmetrical Grid */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-16 py-12 md:py-16 relative z-10">
        <div className="mb-10 border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-[64px] leading-tight md:leading-[72px] font-extrabold tracking-[-0.04em] text-[#e5e2e1]">
              Packet Inspector
            </h1>
            <p className="text-base sm:text-[18px] leading-[28px] text-[#c7c4d7] mt-2 font-normal">
              Deep dive into end-to-end encrypted protocol flows.
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-400 flex items-center gap-2 bg-[#1c1b1b] border border-white/10 px-3 py-1.5 rounded">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>MLS_128_DHKEMX25519_AES128GCM</span>
          </div>
        </div>

        {/* The Flow Grid */}
        <div className="grid grid-cols-12 gap-6 md:gap-8 relative items-start">
          {/* Node 1: Alice (Sender) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 z-10 relative mt-4 md:mt-12">
            <div className="absolute -top-7 -left-3 text-[48px] md:text-[56px] font-black text-white/5 select-none pointer-events-none z-0">
              01
            </div>

            {/* Identity Card - Asymmetrical 2px border */}
            <div className="border-l-2 border-[#FF3535] pl-6 py-2 relative z-10 bg-[#1c1b1b]/40 rounded-r border-y border-r border-white/5">
              <div className="flex items-baseline justify-between mb-4 pr-2">
                <h2 className="text-xl md:text-[24px] leading-[32px] font-bold text-[#e5e2e1] tracking-tight">
                  Transmission Source
                </h2>
                <span className="font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#FF3535] tracking-widest uppercase">
                  ID :: ALICE
                </span>
              </div>

              <div className="font-['JetBrains_Mono',monospace] text-xs sm:text-[14px] text-[#c7c4d7] mb-2 opacity-60">
                &gt;&gt; init_payload_buffer()
              </div>

              <div className="bg-[#131313]/70 border-y border-white/10 py-3 font-['JetBrains_Mono',monospace] text-[14px] relative group rounded-r mr-2">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF3535]/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-transparent border-none text-[#e5e2e1] focus:outline-none focus:ring-0 p-0 resize-none h-24 pl-4 pr-3 text-xs sm:text-sm font-mono leading-relaxed"
                  placeholder="Enter payload data..."
                  rows={3}
                />
              </div>
            </div>

            {/* Forward Indicator */}
            <div className="flex justify-center -mb-4 relative z-0 opacity-50 my-2">
              <span className="material-symbols-outlined text-[32px] text-[#c7c4d7] rotate-90 lg:rotate-0 lg:absolute lg:-right-8 lg:top-1/2 lg:-translate-y-1/2">
                arrow_forward
              </span>
              <div className="lg:hidden absolute top-1/2 w-full h-px border-t border-dashed border-white/20"></div>
            </div>
          </div>

          {/* Node 2: Blind Relay (The Black Box) */}
          <div className="col-span-12 lg:col-span-5 relative z-0 mt-4 md:mt-20">
            <div className="relative bg-[#121212] backdrop-blur-md border border-white/10 rounded shadow-2xl overflow-hidden group hover:border-white/20 transition-colors duration-500 min-h-[340px]">
              {/* Layered Technical Texture Backgrounds */}
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida/AEtjO1VtZuSISyqMlwwK5ZQDBT7F22HdtYrDKXQ31_-lsDr7LW5TdUYRq0kQk7GPoFDUSQp0fxtqnwEiyBOI7oeQJ_-uAFfLGqZd02y-cFm9Q43l3oJUsWnsTneGGxkKTsZcxw7eyendxFnNQWsjTRc2_WnZXk5JAgadY_EwjtW1fZT8Bl2nh5YVihuIe02bOty5_4uEIY2ZRsf6ysmAXxEf9K-okwGLzRv0YxtnUqMZwryyhmHpZE9Qfl6ZuBo')`
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e0e0e]/95 pointer-events-none"></div>

              <div className="relative p-6 sm:p-8 h-full flex flex-col justify-between border-l border-t border-white/5 m-1 z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl md:text-[24px] leading-[32px] font-bold text-[#e5e2e1] tracking-tight flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#FF3535]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        hub
                      </span>
                      Blind Relay
                    </h3>
                    <p className="font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] uppercase tracking-widest mt-1">
                      Obfuscation Layer
                    </p>
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7]/70 flex flex-col items-end">
                    <span className="animate-pulse text-[#FF3535]">_OPSEC_ACTIVE</span>
                    <span className="mt-1">STATE // OBFUSCATED</span>
                  </div>
                </div>

                {/* Raw Ciphertext View */}
                <div className="bg-[#0e0e0e]/70 border-l-2 border-white/20 pl-4 pr-3 py-3 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] break-all leading-relaxed relative rounded-r">
                  <div className="absolute -top-4 right-0 text-[10px] text-zinc-400 tracking-widest uppercase bg-[#121212] px-2 py-0.5 rounded border border-white/5">
                    HEX_DUMP
                  </div>
                  <div className="text-zinc-300 font-mono select-all">
                    {cipherHex}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] opacity-70">
                    <span>[ENTROPY: 7.99]</span>
                    <button
                      onClick={handleCopy}
                      className="text-[#FF3535] hover:text-white transition-colors cursor-pointer font-bold px-2 py-0.5 rounded hover:bg-white/5"
                    >
                      {copied ? '✓ COPIED' : 'COPY RAW HEX'}
                    </button>
                    <span>[SIZE: 256b]</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wire Format Label */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#c7c4d7] flex items-center gap-2 px-3 py-1 bg-[#0e0e0e] border border-white/10 rounded shadow-md z-20 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px] text-[#FF3535]">data_object</span>
              zk-SNARK Payload
            </div>
          </div>

          {/* Node 3: Bob (Recipient) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 z-10 relative mt-8 md:mt-44">
            <div className="absolute -top-7 -left-3 text-[48px] md:text-[56px] font-black text-white/5 select-none pointer-events-none z-0">
              03
            </div>

            <div className="flex justify-center -mt-8 mb-4 relative z-0 opacity-50 hidden lg:flex">
              <span className="material-symbols-outlined text-[32px] text-[#c7c4d7] absolute -left-8 top-1/2 -translate-y-1/2">
                arrow_forward
              </span>
            </div>

            {/* Identity Card - Redesigned */}
            <div className="border-l-2 border-[#10B981] pl-6 py-2 relative z-10 bg-[#1c1b1b]/40 rounded-r border-y border-r border-white/5">
              <div className="flex items-baseline justify-between mb-4 pr-2">
                <h2 className="text-xl md:text-[24px] leading-[32px] font-bold text-[#e5e2e1] tracking-tight">
                  Terminus Node
                </h2>
                <span className="font-['JetBrains_Mono',monospace] text-[12px] font-bold text-[#10B981] tracking-widest uppercase">
                  ID :: BOB
                </span>
              </div>

              <div className="font-['JetBrains_Mono',monospace] text-xs sm:text-[14px] text-[#10B981] mb-2 font-medium">
                &gt;&gt; signature_check: PASSED
              </div>

              <div className="bg-[#131313]/70 border-y border-white/10 py-3 font-['JetBrains_Mono',monospace] text-xs sm:text-[14px] text-[#e5e2e1] mb-4 break-words relative group rounded-r mr-2">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]/50 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                <div className="pl-4 pr-3 font-mono leading-relaxed min-h-[48px]">
                  {inputText ? inputText : '<empty_buffer>'}
                </div>
              </div>

              <button
                onClick={handleExportLog}
                className="font-['JetBrains_Mono',monospace] text-[14px] text-[#c7c4d7] hover:text-white transition-colors flex items-center gap-2 group cursor-pointer pb-1"
              >
                <span className="text-[#3B82F6] font-bold">&gt;</span>
                <span className="underline decoration-white/20 group-hover:decoration-white/100 underline-offset-4">
                  {logExported ? 'log_exported.txt ✓' : 'export_log.txt'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
};
