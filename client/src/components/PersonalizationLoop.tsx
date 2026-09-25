import React, { useState } from 'react';
import { Target, Compass, CalendarCheck, MessageSquarePlus, BrainCircuit, Shuffle, ArrowRight, Check } from 'lucide-react';

export const PersonalizationLoop: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3); // Default on feedback/learning

  const steps = [
    {
      id: 0,
      title: 'GOAL',
      subtitle: 'Target Objective',
      icon: Target,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      description: 'You set your overarching target (e.g. "Programming Exam Preparation" or "System Design Mastery").',
      realExample: 'User sets: 3 hours available, goal = Pass Advanced Algorithms Exam.',
    },
    {
      id: 1,
      title: 'CONTEXT',
      subtitle: 'State & Constraints',
      icon: Compass,
      color: 'from-indigo-500 to-violet-500',
      textColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      description: 'NOVA evaluates your real-time energy, time envelope, focus window (25 min), and preferred style (Practical).',
      realExample: 'State: Medium energy, 25-minute focus intervals, hands-on preference.',
    },
    {
      id: 2,
      title: 'PLAN',
      subtitle: 'Calibrated Schedule',
      icon: CalendarCheck,
      color: 'from-violet-500 to-purple-500',
      textColor: 'text-violet-400',
      borderColor: 'border-violet-500/40',
      description: 'An initial schedule tailored specifically for your rhythm, not a generic one-size-fits-all checklist.',
      realExample: 'Task: 30 min Hard session on Recursive Tree Traversal.',
    },
    {
      id: 3,
      title: 'FEEDBACK',
      subtitle: 'Immediate Signal',
      icon: MessageSquarePlus,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      description: 'You complete the session and tell NOVA how it felt: 😵 Too Difficult, 😐 Just Right, or 🔥 Too Easy.',
      realExample: 'User marks session: "😵 Too Difficult" and asks for "Easier with guided practice".',
    },
    {
      id: 4,
      title: 'LEARNING',
      subtitle: 'Model Calibration',
      icon: BrainCircuit,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      description: 'NOVA updates learned preferences: records difficulty tolerance drop and short-session affinity boost.',
      realExample: 'Preference updated: "Prefers progressive scaffolding before advanced topics" (88% confidence).',
    },
    {
      id: 5,
      title: 'ADAPTATION',
      subtitle: 'Personalized Shift',
      icon: Shuffle,
      color: 'from-pink-500 to-rose-500',
      textColor: 'text-pink-400',
      borderColor: 'border-pink-500/40',
      description: 'Future tasks adapt automatically with explicit transparent reasoning. No black box.',
      realExample: 'Next task shortened from 30 min to 20 min, lowered to Medium, and loaded with guided code templates.',
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0A0E1A]/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            The Continuous Personalization Loop
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            How NOVA Learns Your Work Rhythm
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Click any step to inspect how a real user signal transforms tomorrow’s plan.
          </p>
        </div>
      </div>

      {/* Visual Loop Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`relative flex flex-col items-center p-4 rounded-xl text-center transition-all duration-300 ${
                isSelected
                  ? `bg-white/[0.08] ${step.borderColor} border shadow-lg scale-102`
                  : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/15'
              }`}
            >
              {/* Step number badge */}
              <span className="text-[10px] font-mono text-zinc-500 mb-2">
                0{idx + 1}
              </span>

              {/* Icon */}
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-tr ${step.color} shadow-md`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>

              <span className={`text-xs font-bold tracking-wider ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                {step.title}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                {step.subtitle}
              </span>

              {/* Active indicator dot */}
              {isSelected && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-indigo-400 ring-4 ring-[#0A0E1A]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Step Deep Dive Card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-gradient-to-tr ${steps[activeStep].color}`}>
              {React.createElement(steps[activeStep].icon, { className: 'h-5 w-5 text-white' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold">
                  Step 0{activeStep + 1} of 06
                </span>
                <span className="text-zinc-600">•</span>
                <h4 className="text-base font-bold text-white">{steps[activeStep].title} — {steps[activeStep].subtitle}</h4>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{steps[activeStep].description}</p>
            </div>
          </div>
        </div>

        {/* Live Example Box */}
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-4">
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-indigo-200">Demonstrated In Action: </span>
              <span className="text-zinc-300">{steps[activeStep].realExample}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
