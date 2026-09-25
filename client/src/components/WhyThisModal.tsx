import React from 'react';
import { X, CheckCircle2, Sparkles, BrainCircuit, ShieldAlert, Info } from 'lucide-react';

interface WhyThisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    duration: number;
    difficulty: string;
    whyExplanation?: {
      points: string[];
      confidence: number;
      primaryFactor?: string;
    };
    adaptationNotice?: {
      wasAdapted: boolean;
      reason?: string;
    };
  } | null;
}

export const WhyThisModal: React.FC<WhyThisModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const confidence = data.whyExplanation?.confidence || 85;
  const points = data.whyExplanation?.points || [
    'Tailored to your active focus duration and style preference',
    'Aligned with your primary learning goal',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0D121F] p-6 shadow-2xl text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Why this recommendation?</h3>
            <span className="text-[11px] text-zinc-400">NOVA Transparent Calibration Model</span>
          </div>
        </div>

        {/* Task info tag */}
        <div className="mt-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="text-sm font-semibold text-white">{data.title}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            <span className="text-indigo-400 font-medium">{data.duration} min session</span>
            <span>•</span>
            <span className="text-zinc-300 font-medium">{data.difficulty} Difficulty</span>
          </div>
        </div>

        {/* Confidence score bar */}
        <div className="mt-4 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Personalization Confidence
            </span>
            <span className="font-mono font-bold text-white text-sm">{confidence}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-1.5">
            Calculated from verified task completions, recent feedback signals, and focus duration.
          </div>
        </div>

        {/* Evidence Points */}
        <div className="mt-4 space-y-2.5">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Supporting Evidence
          </div>
          {points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="leading-snug">{pt}</span>
            </div>
          ))}
        </div>

        {/* Adaptation note if present */}
        {data.adaptationNotice?.wasAdapted && (
          <div className="mt-4 rounded-lg border border-violet-500/30 bg-violet-950/20 p-3 text-xs text-violet-200">
            <div className="font-semibold text-violet-300 mb-0.5">Adaptation Signal:</div>
            {data.adaptationNotice.reason}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
