import React, { useState } from 'react';

export const DevMicrosection: React.FC = () => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'init' | 'keypackage' | 'group' | 'decrypt'>('init');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const installCommand = 'git clone https://github.com/ibra01001/enncom_lite.git && cd enncom_lite/App && npm install';

  const snippets = {
    init: {
      title: 'Initialize OpenMLS WASM Provider',
      file: 'App/src/context/MlsContext.tsx',
      code: `import { useEffect, useState } from 'react';
import initWasm, { Provider, Identity } from '@obsidian/mls-wasm';

export const useObsidianKernel = () => {
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState(null);

  useEffect(() => {
    async function bootKernel() {
      // Initialize the WebAssembly module into browser memory
      await initWasm();
      
      const mlsConfig = {
        cipher_suite: "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
        storage_engine: "IndexedDB"
      };

      const provider = new Provider(mlsConfig);
      const identity = new Identity(provider, "alice");
      setIsReady(true);
    }
    bootKernel();
  }, []);
};`,
    },
    keypackage: {
      title: 'Publish Ephemeral Prekey Package',
      file: 'App/src/utils/mlsUtils.ts',
      code: `// Generate signed one-time public KeyPackage
const keyPackage = identity.key_package(provider);
const rawBytes = keyPackage.to_bytes();

// Base64 serialize and publish to server for asynchronous invites
const keyPackageB64 = btoa(String.fromCharCode(...rawBytes));
socket.emit('publish_key_package', { 
  keyPackage: keyPackageB64,
  ciphersuite: "MLS_128_DHKEMX25519" 
});`,
    },
    group: {
      title: 'Propose and Commit Group Addition (TreeKEM)',
      file: 'App/src/utils/groupActions.ts',
      code: `// Fetch Bob's public KeyPackage and commit addition to TreeKEM ratchet
const bobKeyPackage = KeyPackage.from_bytes(bobKeyBytes);
const addCommit = group.propose_and_commit_add(provider, identity, bobKeyPackage);

// Export updated ratchet tree & transmit Welcome packet
const tree = group.export_ratchet_tree();
group.merge_pending_commit(provider);

socket.emit('send_welcome', {
  targetUserId: 'bob_id',
  welcome: btoa(String.fromCharCode(...addCommit.welcome)),
  tree: btoa(String.fromCharCode(...tree.to_bytes()))
});`,
    },
    decrypt: {
      title: 'Blind Relay Receipt & Message Decryption',
      file: 'App/src/components/Chatbox.tsx',
      code: `// Recipient parses incoming blind ciphertext
socket.on('chat message', (msg) => {
  if (msg.ciphertext && activeGroups.has(msg.room)) {
    const group = activeGroups.get(msg.room);
    const ctBytes = Uint8Array.from(atob(msg.ciphertext), c => c.charCodeAt(0));
    
    // Process message through OpenMLS ratchet tree
    const ptBytes = group.process_message(provider, ctBytes);
    const text = new TextDecoder().decode(ptBytes);
    
    displayPlaintextMessage({ ...msg, text });
  }
});`,
    },
  };

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCommand);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeSnippetTab].code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderHighlightedCode = (code: string) => {
    return code.split('\n').map((line, lineIndex) => {
      if (line.trim().startsWith('//')) {
        return (
          <div key={lineIndex} className="text-zinc-500 italic">
            {line}
          </div>
        );
      }

      const tokens = line.split(
        /(\/\/.+$|'[^']*'|"[^"]*"|\b(?:import|from|export|const|await|async|function|new|if|return|let|var|typeof)\b|\b[A-Z][a-zA-Z0-9_]*\b|\b[a-zA-Z_][a-zA-Z0-9_]*(?=\())/g
      );

      return (
        <div key={lineIndex} className="whitespace-pre">
          {tokens.map((token, tokenIndex) => {
            if (!token) return null;
            if (token.startsWith('//')) {
              return (
                <span key={tokenIndex} className="text-zinc-500 italic">
                  {token}
                </span>
              );
            }
            if (
              (token.startsWith("'") && token.endsWith("'")) ||
              (token.startsWith('"') && token.endsWith('"'))
            ) {
              return (
                <span key={tokenIndex} className="text-[#10B981]">
                  {token}
                </span>
              );
            }
            if (
              /^(import|from|export|const|await|async|function|new|if|return|let|var|typeof)$/.test(
                token
              )
            ) {
              return (
                <span key={tokenIndex} className="text-[#c3c1ff] font-semibold">
                  {token}
                </span>
              );
            }
            if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
              return (
                <span key={tokenIndex} className="text-[#38bdf8]">
                  {token}
                </span>
              );
            }
            return (
              <span key={tokenIndex} className="text-zinc-200">
                {token}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <section
      id="developer"
      className="bg-[#272727] border-b border-[#333333] relative overflow-hidden py-16 px-4 md:px-16 selection:bg-[#FF3535] selection:text-white"
    >
      {/* Background SVG Noise Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-[1440px] mx-auto relative z-10">
        {/* Section Header */}
        <div className="mb-10 border-b border-white/10 pb-6 flex justify-between items-end">
          <div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white font-['Hanken_Grotesk',sans-serif] leading-tight">
              Developer<br className="hidden sm:inline" /> Workbench
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 mt-2 max-w-lg font-['Hanken_Grotesk',sans-serif]">
              Zero-friction OpenMLS WebAssembly kernel for client-side encrypted applications.
            </p>
          </div>
        </div>

        {/* Asymmetrical Flow Grid */}
        <div className="grid grid-cols-12 gap-8 relative">
          {/* Node 1: CLI Quickstart */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 z-10 relative lg:mt-8">
            {/* Watermark 01 */}
            <div className="absolute -top-7 -left-4 text-7xl text-white/5 font-black select-none pointer-events-none z-0">
              01
            </div>

            <div className="border-l-2 border-[#FF3535] pl-6 py-4 relative z-10 bg-[#1c1b1b]/50 rounded-r border-y border-r border-white/5 shadow-xl">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Hanken_Grotesk',sans-serif]">
                  Init Environment
                </h3>
                <span className="text-[11px] font-mono text-[#FF3535] tracking-widest uppercase font-bold">
                  ID :: CLI_CORE
                </span>
              </div>

              <div className="font-mono text-xs text-zinc-400 mb-2 opacity-70">
                &gt;&gt; init_pkg_buffer()
              </div>

              <div className="bg-[#121212]/90 border-y border-white/10 py-3.5 px-3 font-mono relative group rounded-r mr-1">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF3535] scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                <div className="flex flex-col gap-2">
                  <div className="font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-200 break-all whitespace-pre-wrap">
                    <span className="text-[#FF3535] mr-2 font-bold select-none">$</span>
                    {installCommand}
                  </div>
                  <button
                    onClick={handleCopyInstall}
                    className="self-end text-xs font-mono text-zinc-300 hover:text-white bg-[#272727] hover:bg-[#FF3535] px-2.5 py-1 rounded transition-colors border border-white/10 font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {copiedInstall ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedInstall ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#FF3535] animate-pulse"></span>
                <span className="font-mono text-[11px] text-zinc-400 tracking-wider">
                  _CLI_READY : AWAITING COMMAND
                </span>
              </div>
            </div>

            {/* Directional Connector Arrow */}
            <div className="flex justify-center relative z-0 opacity-50 my-1">
              <span className="material-symbols-outlined text-[32px] text-zinc-500 rotate-90 lg:rotate-0 lg:absolute lg:-right-8 lg:top-1/2 lg:-translate-y-1/2">
                arrow_forward
              </span>
              <div className="lg:hidden w-full h-px border-t border-dashed border-white/20"></div>
            </div>
          </div>

          {/* Node 2: Code Viewer (Hardware Style) */}
          <div className="col-span-12 lg:col-span-8 relative z-0 lg:mt-2">
            <div className="relative bg-[#121212] backdrop-blur-md border border-white/10 rounded shadow-2xl overflow-hidden group hover:border-white/20 transition-colors duration-500 flex flex-col min-h-[480px]">
              {/* Layered Technical Background */}
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25 pointer-events-none"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida/AEtjO1VtZuSISyqMlwwK5ZQDBT7F22HdtYrDKXQ31_-lsDr7LW5TdUYRq0kQk7GPoFDUSQp0fxtqnwEiyBOI7oeQJ_-uAFfLGqZd02y-cFm9Q43l3oJUsWnsTneGGxkKTsZcxw7eyendxFnNQWsjTRc2_WnZXk5JAgadY_EwjtW1fZT8Bl2nh5YVihuIe02bOty5_4uEIY2ZRsf6ysmAXxEf9K-okwGLzRv0YxtnUqMZwryyhmHpZE9Qfl6ZuBo')",
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e0e0e]/95 pointer-events-none"></div>

              <div className="relative flex flex-col h-full z-10 flex-grow">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start p-6 pb-4 gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 font-['Hanken_Grotesk',sans-serif]">
                      <span className="material-symbols-outlined text-[#FF3535]">terminal</span>
                      Kernel Instance
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mt-1 font-bold">
                      Execution Layer
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 flex flex-col items-end">
                    <span className="animate-pulse text-[#FF3535] font-bold">_OPSEC_ACTIVE</span>
                    <span className="mt-0.5 text-zinc-400">STATE // RUNNING</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between border-y border-white/10 bg-[#0e0e0e]/70 px-4 sm:px-6 overflow-x-auto">
                  <div className="flex overflow-x-auto scrollbar-hide gap-1 py-1">
                    <button
                      onClick={() => setActiveSnippetTab('init')}
                      className={`px-4 sm:px-5 py-2.5 font-mono text-xs transition-colors rounded-t border-b-2 font-bold whitespace-nowrap ${
                        activeSnippetTab === 'init'
                          ? 'text-white border-[#FF3535] bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      01. WASM Init
                    </button>
                    <button
                      onClick={() => setActiveSnippetTab('keypackage')}
                      className={`px-4 sm:px-5 py-2.5 font-mono text-xs transition-colors rounded-t border-b-2 font-bold whitespace-nowrap ${
                        activeSnippetTab === 'keypackage'
                          ? 'text-white border-[#FF3535] bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      02. KeyPackages
                    </button>
                    <button
                      onClick={() => setActiveSnippetTab('group')}
                      className={`px-4 sm:px-5 py-2.5 font-mono text-xs transition-colors rounded-t border-b-2 font-bold whitespace-nowrap ${
                        activeSnippetTab === 'group'
                          ? 'text-white border-[#FF3535] bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      03. TreeKEM Commit
                    </button>
                    <button
                      onClick={() => setActiveSnippetTab('decrypt')}
                      className={`px-4 sm:px-5 py-2.5 font-mono text-xs transition-colors rounded-t border-b-2 font-bold whitespace-nowrap ${
                        activeSnippetTab === 'decrypt'
                          ? 'text-white border-[#FF3535] bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      04. Decrypt Relay
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="shrink-0 my-1 font-mono text-xs text-zinc-300 hover:text-white bg-[#272727] hover:bg-[#FF3535] transition-colors border border-white/10 px-3 py-1.5 rounded flex items-center gap-1.5 font-bold ml-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code Content Area */}
                <div className="flex-grow bg-[#0e0e0e]/80 p-4 sm:p-6 overflow-y-auto font-mono text-xs sm:text-[13px] leading-relaxed relative border-l-2 border-white/10 m-3 sm:m-6 rounded-r">
                  <div className="flex items-start">
                    {/* Line Numbers */}
                    <div className="flex flex-col text-zinc-600 select-none pr-4 text-right border-r border-white/10 mr-4 font-mono shrink-0">
                      {snippets[activeSnippetTab].code.split('\n').map((_, idx) => (
                        <span key={idx}>{idx + 1}</span>
                      ))}
                    </div>

                    {/* Syntax Highlighted Code */}
                    <div className="overflow-x-auto scrollbar-hide flex-grow font-mono">
                      {renderHighlightedCode(snippets[activeSnippetTab].code)}
                    </div>
                  </div>

                  {/* Hardware / Code Telemetry */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center text-[11px] text-zinc-400 font-mono gap-2">
                    <span className="text-[#FF3535] font-bold">[ENTROPY: 7.99]</span>
                    <span className="text-zinc-300">// {snippets[activeSnippetTab].file}</span>
                    <span>[SIZE: {new Blob([snippets[activeSnippetTab].code]).size}b]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
