import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PersonalizationLoop } from '../components/PersonalizationLoop';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Zap,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Cpu,
  Layers,
  Repeat,
  ShieldCheck,
  ChevronRight,
  Play,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { demoLogin, user } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    await demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080B11] text-zinc-100">
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-48 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Hackathon Theme Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-8 shadow-sm shadow-indigo-500/20">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>HACKATHON THEME: PERSONALIZED AI EXPERIENCES</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          NOVA
          <span className="block mt-2 text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-300 via-indigo-100 to-violet-300 bg-clip-text text-transparent">
            An AI that learns how <span className="underline decoration-indigo-500/60 underline-offset-8">YOU</span> work.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Your goals, preferences, behavior and feedback shape the experience.
        </p>

        {/* Key Demo Sentence Callout */}
        <div className="mt-6 inline-block rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md">
          <p className="text-sm sm:text-base font-medium text-indigo-200 italic">
            "Most AI systems personalize the answer. <span className="font-bold text-white not-italic underline decoration-violet-400">NOVA personalizes the experience.</span>"
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 hover:scale-102 transition-all"
          >
            <span>Build My Experience</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={handleDemoClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl border border-violet-500/40 bg-violet-950/30 px-7 py-3.5 text-sm font-bold text-violet-200 hover:bg-violet-900/40 hover:border-violet-400/60 shadow-lg shadow-violet-900/20 transition-all"
          >
            <Play className="h-4 w-4 fill-violet-300 text-violet-300" />
            <span>Try Demo (Alex — Exam Prep)</span>
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Try Demo pre-loads real historical signals: Recursion 😵 Too Difficult, Arrays 😐 Just Right.
        </p>
      </section>

      {/* Visual Personalization Loop Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <PersonalizationLoop />
      </section>

      {/* Live Before & After Adaptation Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            See Adaptive Personalization In Real-Time
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
            When you complete a task and give feedback, NOVA recalculates your plan immediately. Every adaptation includes a transparent rationale.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-6 sm:p-8 backdrop-blur-lg shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            <Repeat className="h-4 w-4 text-indigo-400" />
            <span>Actual Hackathon Personalization Event</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* BEFORE CARD */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/15 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-widest">
                    <TrendingDown className="h-3.5 w-3.5" /> BEFORE FEEDBACK
                  </span>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-500/30">
                    Standard Plan
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Recursive Tree Traversal & Call Stack Tracing
                </h4>
                <p className="text-xs text-zinc-400 mt-2">
                  Analyze tree recursion and trace multi-branch call stack depth with return value propagation.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-red-500/20 flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-300 font-semibold">30 Minutes</span>
                <span className="text-red-300 font-medium">Difficulty: Hard</span>
                <span className="text-zinc-400">Theory Heavy</span>
              </div>
            </div>

            {/* AFTER CARD */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-5 flex flex-col justify-between shadow-lg shadow-emerald-950/30">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    <TrendingUp className="h-3.5 w-3.5" /> AFTER FEEDBACK: "😵 TOO DIFFICULT"
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    Adapted In Real-Time
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Guided Practice: Recursion Base-Cases & Scaffolding
                </h4>
                <p className="text-xs text-zinc-400 mt-2">
                  [Adapted for scaffolding] We broke this down with step-by-step hints, visual call stack templates, and boilerplate.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-300 font-bold">20 Minutes (-10 min)</span>
                <span className="text-emerald-300 font-semibold">Difficulty: Medium (Eased)</span>
                <span className="text-emerald-400 font-semibold">Guided Practice</span>
              </div>
            </div>
          </div>

          {/* RATIONALE BANNER */}
          <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 shrink-0">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Transparent Adaptation Rationale
                </div>
                <p className="text-xs text-zinc-200 mt-0.5">
                  "Your previous task was too difficult, so I reduced the next task from 30 minutes to 20 minutes, lowered difficulty from Hard to Medium, and added guided practice."
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300 px-3 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 whitespace-nowrap self-start sm:self-center">
              Confidence: 88%
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 w-fit mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Learns Your Work Habits</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tracks actual task completions, skipped sessions, energy dips, and preferred modalities (Practical vs Theoretical). Never invents fake history.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400 w-fit mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Contextual AI Coach</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              A coach that knows your goal, today's energy, and recent stumbling blocks. Proposes actionable plan changes you can apply with one click.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="p-3 rounded-xl bg-emerald-600/20 text-emerald-400 w-fit mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Transparent "Why This?"</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Every single recommendation displays explicit supporting evidence, confidence metrics, and historical feedback backing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-zinc-500">
        <p>NOVA AI Productivity Engine • Built for Hackathon: Personalized AI Experiences</p>
        <p className="mt-1">Powered by React, Express, MongoDB Mongoose, and Google Gemini API</p>
      </footer>
    </div>
  );
};
