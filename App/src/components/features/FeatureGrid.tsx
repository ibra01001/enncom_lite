import React from 'react';
import { FeatureCard, FeatureCardProps } from './FeatureCard';

export const FeatureGrid: React.FC = () => {
  const features: FeatureCardProps[] = [
    {
      badge: 'RFC 9420 TreeKEM',
      badgeColor: 'red',
      title: 'TreeKEM Ratchet Architecture',
      subtitle: 'Asynchronous Group Key Derivation',
      summary:
        'Continuous forward secrecy (FS) and post-compromise security (PCS). Ratchets advance per message and per epoch.',
      details: [
        'O(log N) key update overhead for large group chats',
        'Automatic self-healing if a client key is temporarily exposed',
        'Epoch-based commitment trees preventing replay attacks',
      ],
      codeSnippet: {
        filename: 'mls_treekem.rs',
        language: 'rust',
        code: `// OpenMLS TreeKEM Group Epoch Update
let (commit, welcome, _kph) = group
    .propose_and_commit_add(
        &provider,
        &identity,
        &bob_key_package
    )?;
group.merge_pending_commit(&provider)?;`,
      },
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      badge: 'Zero Knowledge',
      badgeColor: 'emerald',
      title: 'Untrusted Blind Relay',
      subtitle: 'Flask + Redis Pass-through',
      summary:
        'The backend server acts as an untrusted message router. It sees only base64 ciphertext envelopes and ephemeral routing IDs.',
      details: [
        'Zero database persistence for message contents or keys',
        'Zero metadata mining — IP and session logs isolated',
        'Relays welcome bundles and ciphertext with zero-knowledge',
      ],
      codeSnippet: {
        filename: 'relay_app.py',
        language: 'python',
        code: `@socketio.on('chat message')
def handle_blind_relay(data):
    # Server strictly passes encrypted bytes
    emit('chat message', {
        'room': data['room'],
        'ciphertext': data['ciphertext']
    }, to=data['room'])`,
      },
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      badge: 'Rust WebAssembly',
      badgeColor: 'cyan',
      title: 'Native-Speed WASM Core',
      subtitle: 'In-Memory Client Cryptography',
      summary:
        'Compiles official OpenMLS Rust crates to WebAssembly, executing directly within the browser’s sandboxed worker memory.',
      details: [
        '< 1.2ms cryptographic framing latency',
        'Memory safety guaranteed by Rust borrow checker',
        'Zero unencrypted keys ever touch disk storage',
      ],
      codeSnippet: {
        filename: 'openmls_wasm.d.ts',
        language: 'typescript',
        code: `export class Group {
  static create_new(p: Provider, id: Identity, group_id: string): Group;
  create_message(p: Provider, id: Identity, pt: Uint8Array): Uint8Array;
  process_message(p: Provider, ct: Uint8Array): Uint8Array;
}`,
      },
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      badge: 'One-Time Public Keys',
      badgeColor: 'purple',
      title: 'Ephemeral KeyPackages',
      subtitle: 'Decentralized Prekey Exchange',
      summary:
        'Users generate signed KeyPackages containing public credentials and HPKE encryption keys for asynchronous invitation.',
      details: [
        'Enables inviting offline members securely',
        'Single-use prekeys mitigate replay and identity spoofing',
        'Signed with Ed25519 identity keys',
      ],
      codeSnippet: {
        filename: 'keypackage_gen.ts',
        language: 'typescript',
        code: `const keyPackage = identity.key_package(provider);
const bytes = keyPackage.to_bytes();
const keyPackageB64 = btoa(String.fromCharCode(...bytes));

socket.emit('publish_key_package', { keyPackage: keyPackageB64 });`,
      },
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      badge: 'Epoch Scaling',
      badgeColor: 'amber',
      title: 'Dynamic Epoch Ratchets',
      subtitle: 'Seamless Membership Transitions',
      summary:
        'Adding or ejecting a member initiates an atomic commit proposal that ratchets group secrets instantly across all active clients.',
      details: [
        'Removed members are cryptographically quarantined instantly',
        'Welcome bundles contain initial RatchetTree structure',
        'No centralized coordinator needed to validate state commits',
      ],
      codeSnippet: {
        filename: 'group_join.ts',
        language: 'typescript',
        code: `// Bob joins using Welcome and Ratchet Tree bytes
const ratchetTree = RatchetTree.from_bytes(treeBytes);
const joinedGroup = Group.join(provider, welcomeBytes, ratchetTree);
activeGroups.set(roomId, joinedGroup);`,
      },
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      badge: 'WebRTC P2P Mesh',
      badgeColor: 'red',
      title: 'Encrypted Media & Video',
      subtitle: 'Authenticated Direct Peer Channels',
      summary:
        'Ultra-low latency audio, video, and binary streams negotiated directly between peers via end-to-end authenticated handshakes.',
      details: [
        'Direct peer-to-peer data channels bypass relay nodes',
        'Signaling payloads protected by OpenMLS session keys',
        'STUN/TURN fallback for NAT traversal with DTLS-SRTP encryption',
      ],
      codeSnippet: {
        filename: 'webrtc_mesh.ts',
        language: 'typescript',
        code: `const peer = new RTCPeerConnection(rtcConfig);
peer.onicecandidate = (event) => {
  if (event.candidate) {
    emitEncryptedSignaling('candidate', event.candidate);
  }
};`,
      },
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features-grid" className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto z-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono mb-3">
          <span>● CORE CAPABILITIES</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white font-heading tracking-tight">
          Engineered for Zero Trust Environments
        </h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Every layer is designed so no server, proxy, or eavesdropper can intercept or tamper with communications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {features.map((feature, idx) => (
          <FeatureCard key={idx} {...feature} />
        ))}
      </div>
    </section>
  );
};
