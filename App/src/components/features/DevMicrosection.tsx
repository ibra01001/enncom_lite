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
      code: `import init, { Provider, Identity } from '../pkg/openmls_wasm';

// 1. Initialize WASM kernel into browser memory
await init();

// 2. Instantiate cryptographic Provider and Ed25519 Identity
const provider = new Provider();
const identity = new Identity(provider, username);`,
    },
    keypackage: {
      title: 'Publish Ephemeral Prekey Package',
      file: 'App/src/utils/mlsUtils.ts',
      code: `// Generate signed one-time public KeyPackage
const keyPackage = identity.key_package(provider);
const rawBytes = keyPackage.to_bytes();

// Base64 serialize and publish to server for asynchronous invites
const keyPackageB64 = btoa(String.fromCharCode(...rawBytes));
socket.emit('publish_key_package', { keyPackage: keyPackageB64 });`,
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

  return (
    <section id="developer" className="ob-section bg-[#272727]">
      <div className="ob-wrap py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="ob-h-md text-white" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>
              Developer workbench
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Zero-friction OpenMLS WebAssembly kernel for client-side encrypted applications.
            </p>
          </div>
          <button
            onClick={handleCopyInstall}
            className="ob-btn-ghost py-2 px-4 text-xs font-bold rounded"
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>{copiedInstall ? '✓ Command copied' : 'Copy clone command'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#272727] border-t border-[#333333]">
        <div className="ob-wrap py-8 flex flex-col gap-6">
          {/* CLI quickstart card */}
          <div className="ob-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0e0e0e] border-[#333333] rounded">
            <div className="flex items-center gap-3 ob-mono text-xs text-white overflow-x-auto w-full">
              <span className="text-zinc-500 font-bold select-none">$</span>
              <code className="text-[#FF3535] font-bold whitespace-nowrap">{installCommand}</code>
            </div>
            <button
              onClick={handleCopyInstall}
              className="text-xs ob-mono text-white hover:text-[#FF3535] transition-colors self-end sm:self-auto shrink-0 border border-[#333333] px-3 py-1.5 bg-[#1e1e1e] font-bold rounded"
            >
              {copiedInstall ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Code Tabs card */}
          <div className="ob-card border-[#333333] rounded overflow-hidden">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-[#333333] bg-[#1e1e1e] px-4 py-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveSnippetTab('init')}
                  className={`ob-mono px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    activeSnippetTab === 'init'
                      ? 'bg-[#FF3535] text-white'
                      : 'text-zinc-300 hover:text-white bg-[#272727] border border-[#333333]'
                  }`}
                >
                  01. WASM Init
                </button>
                <button
                  onClick={() => setActiveSnippetTab('keypackage')}
                  className={`ob-mono px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    activeSnippetTab === 'keypackage'
                      ? 'bg-[#FF3535] text-white'
                      : 'text-zinc-300 hover:text-white bg-[#272727] border border-[#333333]'
                  }`}
                >
                  02. KeyPackages
                </button>
                <button
                  onClick={() => setActiveSnippetTab('group')}
                  className={`ob-mono px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    activeSnippetTab === 'group'
                      ? 'bg-[#FF3535] text-white'
                      : 'text-zinc-300 hover:text-white bg-[#272727] border border-[#333333]'
                  }`}
                >
                  03. TreeKEM Commit
                </button>
                <button
                  onClick={() => setActiveSnippetTab('decrypt')}
                  className={`ob-mono px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    activeSnippetTab === 'decrypt'
                      ? 'bg-[#FF3535] text-white'
                      : 'text-zinc-300 hover:text-white bg-[#272727] border border-[#333333]'
                  }`}
                >
                  04. Decrypt Relay
                </button>
              </div>

              <button
                onClick={handleCopyCode}
                className="ob-mono text-xs text-white hover:text-[#FF3535] transition-colors border border-[#333333] px-3 py-1 bg-[#272727] ml-2 shrink-0 flex items-center gap-1 font-bold rounded"
              >
                <span className="material-symbols-outlined text-xs" style={{ fontSize: '14px' }}>content_copy</span>
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Code Body */}
            <div className="p-5 bg-[#0e0e0e] overflow-x-auto">
              <div className="ob-mono text-xs text-zinc-400 mb-3 flex items-center justify-between">
                <span>// {snippets[activeSnippetTab].file}</span>
                <span className="text-white font-bold">{snippets[activeSnippetTab].title}</span>
              </div>
              <pre className="ob-mono text-xs text-white leading-relaxed font-mono">
                <code>{snippets[activeSnippetTab].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
