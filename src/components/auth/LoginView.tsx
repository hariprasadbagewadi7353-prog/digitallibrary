import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        const errorText = result.error || 'Invalid username or password credentials.';
        setErrorMessage(errorText);
        showToast('error', 'Authentication Failed', errorText);
      } else {
        showToast('success', 'Authenticated', `Welcome back, ${username}!`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'librarian') => {
    const u = role === 'admin' ? 'admin' : 'librarian';
    const p = role === 'admin' ? 'admin123' : 'lib123';
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await login(u, p);
      if (!result.success) {
        const errorText = result.error || 'Authentication failed.';
        setErrorMessage(errorText);
        showToast('error', 'Authentication Failed', errorText);
      } else {
        showToast('success', 'Authenticated', `Welcome back, ${u}!`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-750 overflow-hidden">
        {/* Top Government Embellishment Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 text-center text-white border-b-4 border-amber-500">
          <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
            Government of Karnataka
          </span>
          <h1 className="text-lg font-extrabold mt-2 tracking-tight">
            Department of Public Libraries
          </h1>
          <p className="text-xs text-slate-300">
            Digital Accession, Member & OCR Ledger System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Staff Username / Badge ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or librarian"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Security Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading || isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Circulation Portal</span>
              </>
            )}
          </button>

          {/* Quick Demo Role Selectors */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Role Authentication
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-800">Admin</p>
                <p className="text-[10px] text-slate-500">admin / admin123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('librarian')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <p className="text-xs font-bold text-slate-800">Librarian</p>
                <p className="text-[10px] text-slate-500">librarian / lib123</p>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
