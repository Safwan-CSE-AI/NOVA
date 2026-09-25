import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  User,
  Zap,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const energyOptions: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

  const handleEnergyUpdate = async (energy: 'Low' | 'Medium' | 'High') => {
    try {
      await api.profile.update({ energyLevel: energy });
      updateUser({ energyLevel: energy });
      setSuccessMsg('Energy level updated!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    if (resetConfirm.toUpperCase() !== 'RESET') {
      setError('Please type RESET to confirm');
      return;
    }
    setIsResetting(true);
    setError('');
    try {
      await api.profile.reset('RESET');
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Reset failed');
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-zinc-100">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-600/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-zinc-700/40 to-zinc-800/20 border border-white/10">
            <Settings className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-sm text-zinc-400">Manage your NOVA account and preferences</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <User className="h-4 w-4" />
              Profile
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Name</span>
              <span className="text-sm font-medium text-zinc-100">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Email</span>
              <span className="text-sm font-medium text-zinc-100">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Goal</span>
              <span className="text-sm font-medium text-zinc-100 text-right max-w-[60%]">{user?.goal || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Available Time</span>
              <span className="text-sm font-medium text-zinc-100">{user?.availableTime || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Preferred Style</span>
              <span className="text-sm font-medium text-zinc-100">{user?.preferredStyle || 'Mixed'}</span>
            </div>
            {user?.isDemoUser && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Account Type</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300">
                  DEMO ACCOUNT
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Energy Level */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Zap className="h-4 w-4" />
              Current Energy Level
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-zinc-500 mb-3">This affects how NOVA calibrates today's task difficulty and session length.</p>
            <div className="flex gap-3">
              {energyOptions.map((energy) => (
                <button
                  key={energy}
                  onClick={() => handleEnergyUpdate(energy)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    user?.energyLevel === energy
                      ? energy === 'High'
                        ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                        : energy === 'Low'
                        ? 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                        : 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  {energy === 'High' ? '⚡' : energy === 'Low' ? '😴' : '🔋'} {energy}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Shield className="h-4 w-4" />
              Account Actions
            </div>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-zinc-400" />
                <span>Sign out</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-zinc-400 mb-4">
              Reset your NOVA account to factory state. This deletes all tasks, learned preferences, feedback history, and your personalization profile. <span className="text-red-400 font-semibold">This cannot be undone.</span>
            </p>
            {!showResetDialog ? (
              <button
                onClick={() => setShowResetDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-sm font-semibold text-red-400 hover:bg-red-900/30 hover:border-red-400/50 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Reset NOVA Account
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder='Type "RESET" to confirm'
                  className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-950/10 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-400/50"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowResetDialog(false); setResetConfirm(''); setError(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-zinc-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isResetting || resetConfirm.toUpperCase() !== 'RESET'}
                    className="flex-1 py-2.5 rounded-xl border border-red-500/40 bg-red-600/20 text-sm font-semibold text-red-300 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          NOVA AI Personalization Engine • Hackathon Build 2025
        </p>
      </div>
    </div>
  );
};
