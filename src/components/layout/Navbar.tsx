import React from 'react';
import { 
  Building2, 
  Search, 
  User, 
  LogOut, 
  ShieldCheck, 
  BookOpen, 
  Menu, 
  ScanLine, 
  Clock,
  ExternalLink,
  Library,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate, currentRoute }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-slate-900 dark:bg-slate-950 text-white sticky top-0 z-40 shadow-md border-b border-slate-800 dark:border-slate-850">
      {/* Top Neutral Public Service Banner */}
      <div className="bg-slate-950/80 text-amber-100 text-xs px-4 py-1.5 flex items-center justify-between font-medium tracking-wide border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] sm:text-xs">Government Library • Digital Library Management System</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> {todayDate}
          </span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
            Official Circulation Portal
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-inner">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  GOVERNMENT LIBRARY
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  Digital Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Public Accession, Member & Catalog Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Center: Quick Search Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            id="nav-search-bar-btn"
            onClick={() => onNavigate('search')}
            className="w-full bg-slate-800/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 hover:border-slate-600 rounded-xl px-4 py-2 flex items-center justify-between text-sm transition-colors shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-400" />
              <span className="truncate">Search books, members, accession no...</span>
            </div>
            <kbd className="hidden lg:inline-block bg-slate-700/80 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-600">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right: Theme Toggle, Quick OCR, Role & User profile */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <button
            id="nav-quick-ocr-btn"
            onClick={() => onNavigate('ocr-scanner')}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Scan Physical Document with OCR"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">OCR Scanner</span>
          </button>

          {/* User badge */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-amber-400 font-medium">
                  {user.role === 'ADMIN' ? '👑 Admin' : '📖 Librarian'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold text-xs">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <button
                id="navbar-logout-btn"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Log Out of System"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
