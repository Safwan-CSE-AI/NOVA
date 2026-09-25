import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  Zap,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  RotateCw,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionType?: string;
  changes?: any;
}

const SUGGESTION_PROMPTS = [
  "What should I focus on today?",
  "Make my next task easier",
  "Why did you recommend this plan?",
  "I'm feeling tired — adjust my plan",
  "What have you learned about me?",
];

export const CoachPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${user?.name || 'there'}! 👋 I'm your NOVA AI Coach. I know your goal is "${user?.goal || 'learning'}" and I've been tracking your progress patterns.\n\nAsk me anything — I can adjust your plan, explain my recommendations, or help you stay on track.`,
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await api.ai.coach(messageText);
      if (res.success) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.reply || res.message,
          timestamp: new Date(),
          actionType: res.actionType,
          changes: res.changes,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI Coach');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = async (actionType: string, changes?: any) => {
    try {
      await api.ai.applyCoachAction(actionType, changes);
      const confirmMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Done! I've applied the changes to your plan. Head to the Dashboard to see your updated tasks.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to apply action');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-zinc-100">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/30">
            <Bot className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Coach</h1>
            <p className="text-sm text-zinc-400">Personalized to your goals and work style</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Context-aware</span>
          </div>
        </div>

        {/* User context bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: 'Goal', value: user?.goal?.split(' ').slice(0, 4).join(' ') + (user?.goal && user.goal.split(' ').length > 4 ? '...' : '') || 'N/A', color: 'indigo' },
            { label: 'Energy', value: user?.energyLevel || 'Medium', color: user?.energyLevel === 'High' ? 'emerald' : user?.energyLevel === 'Low' ? 'amber' : 'blue' },
            { label: 'Style', value: user?.preferredStyle || 'Mixed', color: 'violet' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
              <span className="text-zinc-500">{item.label}:</span>
              <span className="text-zinc-200 font-medium">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="rounded-2xl border border-white/10 bg-[#0C101C]/80 backdrop-blur-md overflow-hidden mb-4">
          <div className="h-[420px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-indigo-600/30 border border-indigo-500/30 text-indigo-100 rounded-tr-sm'
                        : 'bg-white/5 border border-white/10 text-zinc-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && msg.actionType && msg.actionType !== 'none' && (
                    <button
                      onClick={() => handleApplyAction(msg.actionType!, msg.changes)}
                      className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Apply this change to my plan
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {SUGGESTION_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI coach anything..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};
