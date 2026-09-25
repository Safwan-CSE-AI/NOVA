import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Zap,
  BookOpen,
  Timer,
  BarChart,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState(user?.goal || 'Prepare for technical interview / exam');
  const [availableTime, setAvailableTime] = useState<'30 min' | '1 hour' | '2 hours' | '3 hours' | '4+ hours'>('2 hours');
  const [energyLevel, setEnergyLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [preferredStyle, setPreferredStyle] = useState<'Practical' | 'Visual' | 'Theoretical' | 'Mixed'>('Practical');
  const [focusDuration, setFocusDuration] = useState<15 | 25 | 45 | 60>(25);
  const [preferredDifficulty, setPreferredDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const data = {
        name: name.trim() || 'Alex',
        goal: goal.trim(),
        availableTime,
        energyLevel,
        preferredStyle,
        focusDuration,
        preferredDifficulty,
        strengths: ['Analytical logic', 'Fast learner'],
        weaknesses: ['Deep multi-hour fatigue'],
      };

      const res = await api.profile.onboarding(data);
      if (res.success) {
        updateUser(res.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding settings');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080B11]">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0C101C]/90 p-8 shadow-2xl backdrop-blur-xl text-left">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold text-indigo-400">Step 0{step} of 04</span>
            <span>{step === 1 ? 'Objective' : step === 2 ? 'Time & Energy' : step === 3 ? 'Learning Modality' : 'Pacing & Cadence'}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* STEP 1: Name & Goal */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
                <Sparkles className="h-3 w-3" />
                Personal Profile
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">What are you working towards?</h2>
              <p className="text-xs text-zinc-400 mt-1">NOVA shapes daily tasks directly around this target.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Your Preferred Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Main Goal / Objective
              </label>
              <textarea
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Prepare for programming exam on Algorithms & Data Structures"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick goal suggestions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'Prepare for programming exam',
                'Master Full-Stack TypeScript',
                'Ace System Design interview',
                'Deep dive into Machine Learning',
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:border-indigo-500/30 transition-colors"
                >
                  + {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Available Time & Energy */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
                <Clock className="h-3 w-3" />
                Workload Envelope
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Time & Energy</h2>
              <p className="text-xs text-zinc-400 mt-1">NOVA ensures session load never triggers burnout.</p>
            </div>

            {/* Available Time */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Available Time Today
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['30 min', '1 hour', '2 hours', '3 hours', '4+ hours'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAvailableTime(t)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      availableTime === t
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Energy */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Current Energy Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { lvl: 'Low', desc: 'Shorter tasks, low cognitive load', emoji: '🔋' },
                  { lvl: 'Medium', desc: 'Balanced focus & standard pacing', emoji: '⚡' },
                  { lvl: 'High', desc: 'Intensive flow & complex challenges', emoji: '🚀' },
                ].map((item) => (
                  <button
                    key={item.lvl}
                    type="button"
                    onClick={() => setEnergyLevel(item.lvl as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      energyLevel === item.lvl
                        ? 'border-indigo-500/60 bg-indigo-600/20 text-white shadow-md'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-xl mb-1">{item.emoji}</div>
                    <div className="text-xs font-bold text-white">{item.lvl}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Preferred Style */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
                <BookOpen className="h-3 w-3" />
                Cognitive Fit
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Preferred Learning Style</h2>
              <p className="text-xs text-zinc-400 mt-1">How does information stick in your brain most effectively?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { style: 'Practical', desc: 'More exercises, coding drills, and hands-on synthesis.', badge: 'Code & Build' },
                { style: 'Visual', desc: 'Flowcharts, architecture diagrams, and call stack mental models.', badge: 'Diagrams & Maps' },
                { style: 'Theoretical', desc: 'Deep foundational proofs, mathematical reasoning, and specs.', badge: 'In-Depth Theory' },
                { style: 'Mixed', desc: 'Balanced rotation between conceptual grounding and live application.', badge: 'Hybrid Cadence' },
              ].map((item) => (
                <button
                  key={item.style}
                  type="button"
                  onClick={() => setPreferredStyle(item.style as any)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    preferredStyle === item.style
                      ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md ring-1 ring-indigo-500/40'
                      : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{item.style}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-mono text-zinc-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Focus Duration & Difficulty */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
                <Timer className="h-3 w-3" />
                Session Duration & Difficulty
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Pacing & Difficulty</h2>
              <p className="text-xs text-zinc-400 mt-1">Tune your individual session blocks.</p>
            </div>

            {/* Focus Duration */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Optimal Focus Block Duration
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {([15, 25, 45, 60] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFocusDuration(mins)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${
                      focusDuration === mins
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md font-bold'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-base font-extrabold">{mins}</div>
                    <div className="text-[10px] text-zinc-400">minutes</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Starting Difficulty Baseline
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setPreferredDifficulty(diff)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      preferredDifficulty === diff
                        ? 'border-violet-500 bg-violet-600/20 text-white shadow-md font-bold'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{diff}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Personalized Plan...
                </>
              ) : (
                <>
                  <span>Generate My Personalized Plan</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
