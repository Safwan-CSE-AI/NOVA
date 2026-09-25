import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FeedbackModal } from '../components/FeedbackModal';
import { WhyThisModal } from '../components/WhyThisModal';
import {
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Brain,
  Repeat,
  RotateCw,
  Flame,
  ShieldCheck,
  AlertCircle,
  Bot,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [nextTask, setNextTask] = useState<any>(null);
  const [stats, setStats] = useState<any>({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [activeFeedbackTask, setActiveFeedbackTask] = useState<any | null>(null);
  const [activeWhyTask, setActiveWhyTask] = useState<any | null>(null);
  const [adaptationNotification, setAdaptationNotification] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [planRes, learnRes] = await Promise.all([
        api.plan.get(),
        api.learn.get().catch(() => ({ signals: { recentFeedbackList: [] } })),
      ]);

      if (planRes.success) {
        setPlan(planRes.plan);
        setTasks(planRes.tasks || []);
        setStats(planRes.stats || { total: 0, completed: 0, pending: 0, completionRate: 0 });
        setNextTask(planRes.nextTask);
      }
      if (learnRes.signals?.recentFeedbackList) {
        setRecentSignals(learnRes.signals.recentFeedbackList.slice(0, 3));
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartTask = async (taskId: string) => {
    try {
      const res = await api.tasks.start(taskId);
      if (res.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'in_progress' } : t)));
        if (nextTask && nextTask._id === taskId) {
          setNextTask((prev: any) => ({ ...prev, status: 'in_progress' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to start task:', err);
    }
  };

  const handleCompleteTask = (task: any) => {
    setActiveFeedbackTask(task);
  };

  const handleFeedbackSuccess = (adaptationResult: any) => {
    if (adaptationResult) {
      setAdaptationNotification(adaptationResult);
    }
    // Refresh dashboard tasks and plan to reflect real-time adaptation
    fetchDashboardData();
  };

  const handleEnergyQuickSwitch = async (newEnergy: 'Low' | 'Medium' | 'High') => {
    if (!user || user.energyLevel === newEnergy) return;
    try {
      await api.profile.update({ energyLevel: newEnergy });
      updateUser({ energyLevel: newEnergy });
      fetchDashboardData();
    } catch (err) {
      console.error('Energy update error:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading && !plan) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080B11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-xs font-semibold text-zinc-400">Loading your personalized experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080B11] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 text-left">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Active Personalized Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, {user?.name || 'Explorer'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Focus: <span className="text-indigo-300 font-medium">"{user?.goal}"</span> • Paced for {user?.focusDuration}-min intervals
          </p>
        </div>

        {/* Quick Energy Selector */}
        <div className="flex items-center gap-3 bg-[#0D121F] border border-white/10 rounded-2xl p-2.5 shadow-lg">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-2 font-semibold">
            <Zap className="h-4 w-4 text-amber-400" />
            Energy:
          </div>
          <div className="flex gap-1.5">
            {(['Low', 'Medium', 'High'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleEnergyQuickSwitch(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  user?.energyLevel === lvl
                    ? lvl === 'Low'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                      : lvl === 'Medium'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Adaptation Notification Toast if plan was just adapted */}
      {adaptationNotification && (
        <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 to-violet-950/60 p-5 backdrop-blur-xl shadow-2xl animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 shrink-0">
              <Brain className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Plan Adapted In Real-Time
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                {adaptationNotification.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdaptationNotification(null)}
            className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-all shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        {/* Card 1: Today's Plan & Progress */}
        <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Today's Progress</span>
            <span className="font-mono text-indigo-400 font-bold">{stats.completionRate}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{stats.completed} of {stats.total} sessions finished</span>
            <span className="text-zinc-300 font-medium">{plan?.totalDuration || 60}m total load</span>
          </div>
        </div>

        {/* Card 2: Current Focus */}
        <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Current Focus</span>
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/30">
              {user?.preferredStyle}
            </span>
          </div>
          <div className="text-sm font-bold text-white mt-1 line-clamp-1">
            {plan?.focusGoal || user?.goal}
          </div>
          <div className="text-xs text-zinc-400 mt-2">
            Target Focus Window: <span className="font-mono text-zinc-200 font-semibold">{user?.focusDuration} min</span>
          </div>
        </div>

        {/* Card 3: AI Insight */}
        <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1">
            <Brain className="h-3.5 w-3.5" />
            <span>AI Calibration Insight</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {user?.energyLevel === 'Low'
              ? 'Low energy detected: sessions capped at 20m with reduced cognitive friction.'
              : user?.preferredStyle === 'Practical'
              ? 'Practical bias active: hands-on exercises prioritized over abstract explanations.'
              : 'Pacing aligned with active goal progression and recent feedback.'}
          </p>
          <div className="mt-2 text-[10px] text-zinc-500 font-mono">
            Model: Adaptive Rule Engine + Gemini
          </div>
        </div>
      </div>

      {/* Next Task Hero Spotlight */}
      {nextTask && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-tr from-[#0F172A] via-[#0D1222] to-[#131127] p-6 sm:p-7 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/40">
                  NEXT RECOMMENDED TASK
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono text-zinc-300">
                  {nextTask.category || 'Core'}
                </span>
                {nextTask.adaptationNotice?.wasAdapted && (
                  <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300 border border-violet-500/30 flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> Adapted
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {nextTask.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {nextTask.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span className="font-mono font-bold text-white">{nextTask.duration} minutes</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-zinc-500">•</span>
                  <span>Difficulty: </span>
                  <span className={`font-semibold ${
                    nextTask.difficulty === 'Hard' ? 'text-red-400' : nextTask.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {nextTask.difficulty}
                  </span>
                </div>
                {nextTask.whyExplanation?.confidence && (
                  <div className="flex items-center gap-1.5 text-indigo-300">
                    <span className="text-zinc-500">•</span>
                    <span>Confidence: {nextTask.whyExplanation.confidence}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveWhyTask(nextTask)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <HelpCircle className="h-4 w-4 text-indigo-400" />
                <span>Why This?</span>
              </button>

              {nextTask.status === 'in_progress' ? (
                <button
                  onClick={() => handleCompleteTask(nextTask)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete & Adapt</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStartTask(nextTask._id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 hover:scale-102 transition-all"
                >
                  <Play className="h-4 w-4 fill-white text-white" />
                  <span>Start Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks List */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Today's Schedule</h3>
          <Link
            to="/plan"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>View Full Timeline & Adaptation Log</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';
            return (
              <div
                key={task._id || idx}
                className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/20 bg-emerald-950/10 opacity-75'
                    : isInProgress
                    ? 'border-indigo-500/50 bg-[#0F172A] shadow-md shadow-indigo-500/10'
                    : 'border-white/10 bg-[#0C101C] hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">#{idx + 1}</span>
                      <span className="text-xs font-mono font-medium text-zinc-400 rounded bg-white/5 px-2 py-0.5">
                        {task.category || 'General'}
                      </span>
                      {task.adaptationNotice?.wasAdapted && (
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                          Adapted
                        </span>
                      )}
                      {isCompleted && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      )}
                    </div>

                    <h4 className={`text-base font-bold ${isCompleted ? 'text-zinc-400 line-through' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1">
                      <span className="font-mono text-zinc-300">{task.duration} min</span>
                      <span>•</span>
                      <span className={`${
                        task.difficulty === 'Hard' ? 'text-red-400' : task.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {task.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveWhyTask(task)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Why?
                    </button>

                    {!isCompleted && (
                      isInProgress ? (
                        <button
                          onClick={() => handleCompleteTask(task)}
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

      {/* Bottom Row: Recent Feedback Signals & Coach Promo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Recent Feedback Signals */}
        <div className="rounded-2xl border border-white/10 bg-[#0C101C] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">Recent Signals Logged</h3>
            <Link to="/learn" className="text-xs font-semibold text-indigo-400 hover:underline">
              Inspect Model
            </Link>
          </div>

          {recentSignals.length > 0 ? (
            <div className="space-y-3">
              {recentSignals.map((sig, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white line-clamp-1">{sig.taskTitle}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sig.difficultyFeedback === 'Too Difficult'
                        ? 'bg-amber-500/20 text-amber-300'
                        : sig.difficultyFeedback === 'Too Easy'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {sig.difficultyFeedback}
                    </span>
                  </div>
                  {sig.comment && (
                    <p className="text-xs text-zinc-400 italic">"{sig.comment}"</p>
                  )}
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Requested: <span className="text-zinc-300">{sig.requestedChange}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-4">No feedback signals recorded yet. Complete a task to generate learning data!</p>
          )}
        </div>

        {/* AI Coach Banner */}
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-[#121124] to-[#0A0D18] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/30 mb-3">
              <Bot className="h-3.5 w-3.5" />
              Contextual AI Coach
            </div>
            <h3 className="text-lg font-bold text-white">Need to adjust your workload on the fly?</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tell NOVA "I'm tired today" or "That was too hard" and the coach will propose actionable plan adjustments you can apply instantly.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Available 24/7</span>
            <Link
              to="/coach"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-md shadow-violet-600/30"
            >
              <span>Talk to Coach</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {activeFeedbackTask && (
        <FeedbackModal
          task={activeFeedbackTask}
          isOpen={!!activeFeedbackTask}
          onClose={() => setActiveFeedbackTask(null)}
          onSuccess={handleFeedbackSuccess}
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
