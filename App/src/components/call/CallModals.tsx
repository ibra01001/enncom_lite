import React from 'react';
import type { CallParticipant } from './callTypes';

export const VolumeModal: React.FC<{ id: string | null; participants: CallParticipant[]; onClose: () => void; onChange: (id: string, v: number) => void }> = ({ id, participants, onClose, onChange }) => {
  if (!id) return null;
  const p = participants.find(x => x.id === id);
  const vol = p?.volume ?? 100;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={onClose}>
      <div className="w-[88vw] max-w-[360px] bg-[#181818] border border-[#333333] rounded p-6 shadow-2xl text-left" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] font-bold text-[#ff3535] tracking-widest uppercase">AUDIO GAIN // CONFIG</span>
            <span className="font-bold text-white text-sm font-mono truncate">{p?.name}</span>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white shrink-0 ml-3 cursor-pointer">✕</button>
        </div>
        <div className="py-5 flex flex-col gap-4">
          <div className="flex justify-between text-xs font-mono"><span className="text-zinc-400 uppercase">Input Amplitude</span><span className="font-bold text-[#ff3535]">{vol}%</span></div>
          <input type="range" min={0} max={200} value={vol} onChange={e => onChange(id, +e.target.value)} className="w-full accent-[#ff3535] h-2 bg-[#272727] rounded cursor-pointer" />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase"><span>0% (MUTED)</span><span>100% (UNITY)</span><span>200% (BOOST)</span></div>
        </div>
        <button type="button" onClick={() => onChange(id, 100)} className="w-full py-2 bg-[#202020] hover:bg-[#272727] border border-[#333333] hover:border-[#ff3535] text-xs font-mono font-bold text-zinc-200 rounded uppercase cursor-pointer">Reset Unity (100%)</button>
      </div>
    </div>
  );
};


