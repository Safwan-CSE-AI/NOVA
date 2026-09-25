import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  Bot,
  Brain,
  Settings,
  LogOut,
  Zap,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUpdatingEnergy, setIsUpdatingEnergy] = useState(false);

  const handleEnergyChange = async (newEnergy: 'Low' | 'Medium' | 'High') => {
    if (!user || user.energyLevel === newEnergy || isUpdatingEnergy) return;
    setIsUpdatingEnergy(true);
    try {
      await api.profile.update({ energyLevel: newEnergy });
      updateUser({ energyLevel: newEnergy });
    } catch (err) {
      console.error('Failed to update energy level:', err);
    } finally {
      setIsUpdatingEnergy(false);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan', label: 'Plan', icon: CalendarDays },
    { to: '/coach', label: 'AI Coach', icon: Bot },
    { to: '/learn', label: 'What NOVA Learned', icon: Brain },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#080B11]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0A0E1A]">
              <Sparkles className="h-5 w-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-xl text-white">NOVA</span>
              {user?.isDemoUser && (
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                  DEMO MODE
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 tracking-tight -mt-1 hidden sm:block">
              Learns How You Work
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Energy switcher pills */}
              <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
                <span className="flex items-center gap-1 text-zinc-400 px-1.5 font-medium">
                  <Zap className="h-3 w-3 text-amber-400" />
                  Energy:
                </span>
                {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleEnergyChange(lvl)}
                    disabled={isUpdatingEnergy}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                      user.energyLevel === lvl
                        ? lvl === 'Low'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : lvl === 'Medium'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-zinc-400">{user.preferredStyle}</span>
                </div>
              </div>

              {/* Sign out */}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-3.5 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu hamburger */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B0F19] px-4 py-4 space-y-2">
          {/* Energy quick selector */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Current Energy:
            </span>
            <div className="flex gap-1">
              {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleEnergyChange(lvl)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    user.energyLevel === lvl
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
