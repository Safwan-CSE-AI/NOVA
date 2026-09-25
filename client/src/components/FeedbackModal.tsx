import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import {
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Brain,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';

interface FeedbackModalProps {
  task: {
    _id: string;
    title: string;
    duration: number;
    difficulty: string;
    category?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adaptationResult: any) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [difficulty, setDifficulty] = useState<'Too Difficult' | 'Just Right' | 'Too Easy'>('Just Right');
  const [helpfulness, setHelpfulness] = useState<'Yes' | 'Somewhat' | 'No'>('Yes');
  const [requestedChange, setRequestedChange] = useState<
    'Easier' | 'Harder' | 'Shorter' | 'More examples' | 'More explanation'
  >('More examples');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adaptationData, setAdaptationData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.tasks.feedback(task._id, {
        difficultyFeedback: difficulty,
        helpfulness,
        requestedChange,
        comment,
      });

      // Fire subtle confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore if canvas-confetti is not loaded
      }

      if (response.adaptation) {
        setAdaptationData(response.adaptation);
      } else {
        onSuccess(null);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onSuccess(adaptationData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D121F] p-6 shadow-2xl text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {!adaptationData ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Task Completed
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">How did that feel?</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                Session: <span className="text-zinc-200 font-medium">"{task.title}"</span> ({task.duration} min, {task.difficulty})
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            {/* Question 1: Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Difficulty Feedback
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: 'Too Difficult', emoji: '😵', label: 'Too Difficult', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                  { value: 'Just Right', emoji: '😐', label: 'Just Right', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
                  { value: 'Too Easy', emoji: '🔥', label: 'Too Easy', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setDifficulty(item.value as any);
                      // Auto suggest requestedChange based on difficulty
                      if (item.value === 'Too Difficult') setRequestedChange('Easier');
                      else if (item.value === 'Too Easy') setRequestedChange('Harder');
                      else setRequestedChange('More examples');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                      difficulty === item.value
                        ? `${item.color} shadow-md scale-102`
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Helpfulness */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Was this helpful?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Yes', 'Somewhat', 'No'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHelpfulness(opt)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      helpfulness === opt
                        ? 'border-indigo-500/50 bg-indigo-600/20 text-white font-semibold'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: What should change? */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                What should change in upcoming tasks?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['Easier', 'Harder', 'Shorter', 'More examples', 'More explanation'] as const).map((change) => (
                  <button
                    key={change}
                    type="button"
                    onClick={() => setRequestedChange(change)}
                    className={`py-2 px-2.5 rounded-lg border text-xs text-center transition-all ${
                      requestedChange === change
                        ? 'border-violet-500/50 bg-violet-600/20 text-white font-semibold shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {change}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Any quick notes for NOVA? (Optional)
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Tree recursion was tricky to visualize without boilerplate"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Skip Feedback
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adapting Your Plan...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Submit & Recalibrate Plan
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ADAPTATION REVEAL VIEW (BEFORE VS AFTER) */
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30 mb-2">
                <Brain className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                NOVA Adapted Your Plan
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Plan Updated In Real-Time
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Your feedback triggered an instant calibration for upcoming tasks:
              </p>
            </div>

            {/* Before vs After Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* BEFORE */}
                <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">
                    <TrendingDown className="h-3 w-3" /> BEFORE
                  </div>
                  <div className="text-sm font-semibold text-white line-clamp-1">
                    {adaptationData.before.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-300">{adaptationData.before.duration} min</span>
                    <span>•</span>
                    <span className="text-red-300 font-medium">{adaptationData.before.difficulty}</span>
                  </div>
                </div>

                {/* AFTER */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                    <TrendingUp className="h-3 w-3" /> AFTER
                  </div>
                  <div className="text-sm font-semibold text-white line-clamp-1">
                    {adaptationData.after.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                    <span className="font-mono text-emerald-300 font-semibold">{adaptationData.after.duration} min</span>
                    <span>•</span>
                    <span className="text-emerald-300 font-medium">{adaptationData.after.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* REASON */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3.5">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Reason for Adaptation
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                  "{adaptationData.reason}"
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all"
              >
                <span>Continue With Adapted Plan</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
