import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  BookPlus,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  AlertOctagon,
  ScanLine,
  Search,
  FileSpreadsheet,
  Shield,
  FolderTree,
  Sliders,
  ScrollText,
  ChevronDown,
  LogOut,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpen: boolean;
  onClose: () => void;
  overdueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpen,
  onClose,
  overdueCount = 2,
}) => {
  const { user, logout, isAdmin } = useAuth();

  // Collapsible menu sections
  const [membersOpen, setMembersOpen] = useState(true);
  const [booksOpen, setBooksOpen] = useState(true);
  const [transactionsOpen, setTransactionsOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const handleNav = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const isActive = (route: string) => currentRoute === route;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-30 lg:h-[calc(100vh-76px)]`}
      >
        {/* Mobile Header in sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Government Library System</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Main Dashboard */}
          <button
            id="nav-dashboard"
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive('dashboard')
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isActive('dashboard') ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Dashboard</span>
            <span className="ml-auto text-[10px] uppercase font-bold opacity-60">Live</span>
          </button>

          {/* Dedicated OCR Scanner Link */}
          <button
            id="nav-ocr-scanner"
            onClick={() => handleNav('ocr-scanner')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive('ocr-scanner')
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            <ScanLine className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Digital OCR Scanner</span>
              <span className="text-[10px] opacity-75">English & ಕನ್ನಡ OCR</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-400" />
          </button>

          {/* Section: MEMBERS */}
          <div className="pt-2">
            <button
              onClick={() => setMembersOpen(!membersOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Members</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${membersOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {membersOpen && (
              <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-3">
                <button
                  id="nav-members-all"
                  onClick={() => handleNav('members')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('members') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>All Members</span>
                </button>

                <button
                  id="nav-members-add"
                  onClick={() => handleNav('members/add')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('members/add') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Add Member</span>
                </button>

                <button
                  id="nav-members-scan"
                  onClick={() => handleNav('members/scan')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('members/scan') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan Member Record</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: BOOKS */}
          <div className="pt-2">
            <button
              onClick={() => setBooksOpen(!booksOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Books Catalog</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${booksOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {booksOpen && (
              <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-3">
                <button
                  id="nav-books-all"
                  onClick={() => handleNav('books')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('books') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>All Books</span>
                </button>

                <button
                  id="nav-books-add"
                  onClick={() => handleNav('books/add')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('books/add') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <BookPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Add Book</span>
                </button>

                <button
                  id="nav-books-scan"
                  onClick={() => handleNav('books/scan')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('books/scan') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan Book Record</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: TRANSACTIONS & CIRCULATION */}
          <div className="pt-2">
            <button
              onClick={() => setTransactionsOpen(!transactionsOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200"
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Circulation</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${transactionsOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {transactionsOpen && (
              <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-3">
                <button
                  id="nav-issue-book"
                  onClick={() => handleNav('issue-book')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('issue-book') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Issue Book</span>
                </button>

                <button
                  id="nav-return-book"
                  onClick={() => handleNav('return-book')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('return-book') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>Return Book</span>
                </button>

                <button
                  id="nav-transactions-history"
                  onClick={() => handleNav('transactions')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('transactions') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transaction History</span>
                </button>

                <button
                  id="nav-overdue"
                  onClick={() => handleNav('overdue')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('overdue') ? 'bg-rose-950/60 text-rose-300 font-semibold border border-rose-800/50' : 'text-rose-400/90 hover:text-rose-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Overdue Books</span>
                  </div>
                  {overdueCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {overdueCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Section: SEARCH & REPORTS */}
          <div className="pt-2 space-y-1">
            <button
              id="nav-search"
              onClick={() => handleNav('search')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('search') ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <Search className={`w-4 h-4 ${isActive('search') ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Global Search</span>
            </button>

            <button
              id="nav-reports"
              onClick={() => handleNav('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('reports') ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${isActive('reports') ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Official Reports</span>
            </button>
          </div>

          {/* Section: ADMIN (Protected) */}
          <div className="pt-3">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider hover:text-amber-400"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Administration</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>

            {adminOpen && (
              <div className="pl-4 space-y-1 mt-1 border-l border-slate-800 ml-3">
                <button
                  id="nav-admin-users"
                  onClick={() => handleNav('admin/users')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('admin/users') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>User & Librarians</span>
                  {!isAdmin && <span className="ml-auto text-[9px] bg-slate-800 px-1 rounded text-slate-500">Admin</span>}
                </button>

                <button
                  id="nav-admin-categories"
                  onClick={() => handleNav('admin/categories')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('admin/categories') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                  <span>Book Categories</span>
                </button>

                <button
                  id="nav-admin-settings"
                  onClick={() => handleNav('admin/settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('admin/settings') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Library Settings</span>
                </button>

                <button
                  id="nav-admin-audit"
                  onClick={() => handleNav('admin/audit-logs')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive('admin/audit-logs') ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ScrollText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Logs</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>System Node:</span>
            <span className="font-mono text-[11px] text-emerald-400">ONLINE (Port 3000)</span>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-700 hover:border-rose-800/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
