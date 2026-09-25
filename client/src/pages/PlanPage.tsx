import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FeedbackModal } from '../components/FeedbackModal';
import { WhyThisModal } from '../components/WhyThisModal';
import {
  CalendarDays,
  Sparkles,
  RotateCw,
  Repeat,
  CheckCircle2,
  Clock,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Brain,
  Play,
  Loader2,
} from 'lucide-react';

export const PlanPage: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [adaptationHistory, setAdaptationHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');

  const [activeFeedbackTask, setActiveFeedbackTask] = useState<any | null>(null);
  const [activeWhyTask, setActiveWhyTask] = useState<any | null>(null);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.plan.get();
      if (res.success) {
        setPlan(res.plan);
        setTasks(res.tasks || []);
        setAdaptationHistory(res.plan?.adaptationHistory || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const res = await api.plan.generate();
      if (res.success) {
        await loadPlan();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate plan');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await api.tasks.start(taskId);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'in_progress' } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && !plan) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080B11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-xs font-semibold text-zinc-400">Loading plan schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080B11] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <CalendarDays className="h-3.5 w-3.5" />
            Adaptive Daily Plan
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Schedule & Adaptation Timeline
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Goal: <span className="text-zinc-200 font-semibold">{plan?.focusGoal || user?.goal}</span> • Total Duration: {plan?.totalDuration || 60}m
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-400/50 disabled:opacity-50 transition-all self-start sm:self-center"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Regenerating Plan...</span>
            </>
          ) : (
            <>
              <RotateCw className="h-3.5 w-3.5" />
              <span>Regenerate Fresh Plan</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Main Grid: Tasks Timeline (Left) & Adaptation History Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scheduled Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Today's Calibrated Tasks</h2>
            <span className="text-xs text-zinc-400 font-mono">{tasks.length} sessions</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              return (
                <div
                  key={task._id || idx}
                  className={`rounded-2xl border p-5 transition-all ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-950/10 opacity-75'
                      : isInProgress
                      ? 'border-indigo-500/60 bg-[#0F172A] shadow-md shadow-indigo-500/10'
                      : 'border-white/10 bg-[#0C101C]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">0{idx + 1}</span>
                        <span className="text-xs font-mono text-zinc-400 rounded bg-white/5 px-2 py-0.5">
                          {task.category || 'Core'}
                        </span>
                        {task.adaptationNotice?.wasAdapted && (
                          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30 flex items-center gap-1">
                            <Repeat className="h-3 w-3" /> Adapted
                          </span>
                        )}
                        {isCompleted && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold ${isCompleted ? 'text-zinc-400 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                        <div className="flex items-center gap-1 text-zinc-300">
                          <Clock className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="font-mono font-semibold">{task.duration} min</span>
                        </div>
                        <span>•</span>
                        <span className={`${
                          task.difficulty === 'Hard' ? 'text-red-400' : task.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                        } font-medium`}>
                          Difficulty: {task.difficulty}
                        </span>
                      </div>

                      {/* If adapted, show note inline */}
                      {task.adaptationNotice?.wasAdapted && (
                        <div className="mt-2 rounded-lg border border-violet-500/30 bg-violet-950/20 p-2.5 text-xs text-violet-200">
                          <span className="font-semibold text-violet-300">Adaptation Reason: </span>
                          {task.adaptationNotice.reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => setActiveWhyTask(task)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Why?</span>
                      </button>

                      {!isCompleted && (
                        isInProgress ? (
                          <button
                            onClick={() => setActiveFeedbackTask(task)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Complete</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTask(task._id)}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-sm"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" />
                            <span>Start</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Adaptation History Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Repeat className="h-4 w-4 text-violet-400" />
              <span>Adaptation Log</span>
            </h2>
            <span className="text-xs text-zinc-500">{adaptationHistory.length} events</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-5 shadow-xl space-y-4">
            <p className="text-xs text-zinc-400">
              Every adjustment NOVA made to your plan based on completed tasks, energy switches, or feedback.
            </p>

            {adaptationHistory.length > 0 ? (
              <div className="space-y-3.5 border-l-2 border-indigo-500/30 pl-4 ml-1">
                {adaptationHistory.map((item, i) => (
                  <div key={i} className="relative space-y-1.5">
                    {/* Bullet dot */}
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-[#0C101C]" />

                    <div className="text-[10px] text-zinc-500 font-mono">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'} • {item.trigger || 'Feedback'}
                    </div>

                    <p className="text-xs font-semibold text-white leading-snug">
                      "{item.reason}"
                    </p>

                    {(item.beforeSummary || item.afterSummary) && (
                      <div className="text-[11px] space-y-0.5 pt-1">
                        {item.beforeSummary && (
                          <div className="text-zinc-500">
                            <span className="text-red-400 font-medium">Was:</span> {item.beforeSummary}
                          </div>
                        )}
                        {item.afterSummary && (
                          <div className="text-zinc-300">
                            <span className="text-emerald-400 font-medium">Now:</span> {item.afterSummary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-4">No adaptations recorded yet for this plan.</p>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {activeFeedbackTask && (
        <FeedbackModal
          task={activeFeedbackTask}
          isOpen={!!activeFeedbackTask}
          onClose={() => setActiveFeedbackTask(null)}
          onSuccess={() => loadPlan()}
        />
      )}

      {/* Why This Modal */}
      {activeWhyTask && (
        <WhyThisModal
          isOpen={!!activeWhyTask}
          onClose={() => setActiveWhyTask(null)}
          data={activeWhyTask}
        />
      )}
    </div>
  );
};
