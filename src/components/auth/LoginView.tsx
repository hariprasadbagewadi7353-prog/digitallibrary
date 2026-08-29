import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Library,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username.trim()) {
      setErrorMessage('Please enter your Staff Username or Badge ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Security Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username, password, rememberMe);
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
      const result = await login(u, p, rememberMe);
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
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      {/* Theme Toggle in Login View Corner */}
      <div className="absolute top-4 right-4">
        <button
          id="login-theme-toggle-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Top Government Embellishment Banner */}
        <div className="bg-slate-900 dark:bg-slate-950 p-6 text-center text-white border-b-4 border-amber-500">
          <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Library className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
            Official Public Portal
          </span>
          <h1 className="text-xl font-extrabold mt-2 tracking-tight">
            Government Library
          </h1>
          <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
            Digital Library Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div>
            <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Staff Username / Badge ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="login-username-input"
                name="username"
                autoComplete="username"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="admin or librarian"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Security Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="login-password-input"
                name="password"
                autoComplete="current-password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                id="login-remember-checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300 dark:border-slate-700"
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {errorMessage && (
            <div id="login-error-alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            id="login-submit-button"
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
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Role Authentication
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chief Admin</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">admin / admin123</p>
              </button>

              <button
                id="quick-login-librarian"
                type="button"
                onClick={() => handleQuickLogin('librarian')}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Staff Librarian</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">librarian / lib123</p>
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="py-3 px-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Official Public Library Management & Accession Portal
        </div>
      </div>
    </div>
  );
};

