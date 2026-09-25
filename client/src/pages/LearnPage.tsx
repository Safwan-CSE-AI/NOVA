import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  BookOpen,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LearnedPref {
  _id: string;
  key: string;
  category: string;
  value: string;
  confidence: number;
  evidenceCount: number;
  source: string;
  updatedAt: string;
}

interface Signals {
  taskCompletionRate: number;
  avgDifficulty: string;
  preferredTime: string;
  skipRate: number;
  dominantFeedback: string;
  recentFeedbackList: any[];
  totalFeedbackCount: number;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  session_length: { label: 'Session Length', icon: Clock, color: 'indigo' },
  difficulty: { label: 'Difficulty Level', icon: BarChart2, color: 'violet' },
  modality: { label: 'Learning Style', icon: BookOpen, color: 'cyan' },
  energy: { label: 'Energy Pattern', icon: Zap, color: 'amber' },
  default: { label: 'Preference', icon: Brain, color: 'emerald' },
};

export const LearnPage: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<LearnedPref[]>([]);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.learn.get();
      if (res.success) {
        setPreferences(res.preferences || []);
        setSignals(res.signals || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load learned preferences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'emerald';
    if (confidence >= 50) return 'indigo';
    if (confidence >= 30) return 'amber';
    return 'zinc';
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-zinc-100">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-violet-600/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/30">
                <Brain className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">What NOVA Learned</h1>
                <p className="text-sm text-zinc-400">Your personalized AI profile — built from real behavior</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-violet-600/30" />
                <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
              </div>
              <p className="text-sm text-zinc-400">Loading your learning profile...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-950/20">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : (
          <>
            {/* Behavior Signals Overview */}
            {signals && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Behavior Signals
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Task Completion Rate',
                      value: `${Math.round(signals.taskCompletionRate)}%`,
                      color: signals.taskCompletionRate >= 70 ? 'emerald' : 'amber',
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Total Feedback Given',
                      value: signals.totalFeedbackCount.toString(),
                      color: 'indigo',
                      icon: Sparkles,
                    },
                    {
                      label: 'Dominant Feedback',
                      value: signals.dominantFeedback || 'N/A',
                      color: 'violet',
                      icon: TrendingUp,
                    },
                    {
                      label: 'Skip Rate',
                      value: `${Math.round(signals.skipRate)}%`,
                      color: signals.skipRate > 30 ? 'red' : 'emerald',
                      icon: AlertCircle,
                    },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className={`p-2 rounded-lg bg-${stat.color}-600/15 w-fit mb-3`}>
                          <Icon className={`h-4 w-4 text-${stat.color}-400`} />
                        </div>
                        <div className={`text-xl font-bold text-${stat.color}-300`}>{stat.value}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learned Preferences */}
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Learned Preferences ({preferences.length})
              </h2>

              {preferences.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
                  <Brain className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-zinc-300 mb-2">
                    No preferences learned yet
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                    Complete tasks and give feedback to help NOVA learn your patterns. The more you interact, the smarter the personalization becomes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {preferences.map((pref) => {
                    const meta = CATEGORY_META[pref.category] || CATEGORY_META.default;
                    const Icon = meta.icon;
                    const confColor = getConfidenceColor(pref.confidence);

                    return (
                      <div
                        key={pref._id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] hover:border-white/15 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-${meta.color}-600/15`}>
                            <Icon className={`h-4 w-4 text-${meta.color}-400`} />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{pref.evidenceCount} signals</span>
                        </div>

                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                          {meta.label}
                        </div>
                        <div className="text-base font-bold text-white mb-3">{pref.value}</div>

                        {/* Confidence bar */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-zinc-500">Confidence</span>
                            <span className={`font-semibold text-${confColor}-400`}>{pref.confidence}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r from-${confColor}-600 to-${confColor}-400 transition-all`}
                              style={{ width: `${pref.confidence}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 text-[10px] text-zinc-600 leading-relaxed">{pref.source}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Feedback Timeline */}
            {signals?.recentFeedbackList && signals.recentFeedbackList.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Recent Feedback Timeline
                </h2>
                <div className="space-y-3">
                  {signals.recentFeedbackList.slice(0, 5).map((fb: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        fb.difficultyFeedback === 'Too Difficult' ? 'bg-red-400' :
                        fb.difficultyFeedback === 'Too Easy' ? 'bg-blue-400' : 'bg-emerald-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{fb.taskTitle}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            fb.difficultyFeedback === 'Too Difficult'
                              ? 'bg-red-950/40 border-red-500/30 text-red-300'
                              : fb.difficultyFeedback === 'Too Easy'
                              ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                          }`}>
                            {fb.difficultyFeedback}
                          </span>
                          {fb.requestedChange && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-950/30 text-indigo-300">
                              → {fb.requestedChange}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
