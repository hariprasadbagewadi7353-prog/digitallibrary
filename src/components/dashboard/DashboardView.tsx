import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  ArrowUpRight,
  AlertOctagon,
  ArrowRightLeft,
  CalendarPlus,
  UserPlus,
  ScanLine,
  ArrowDownLeft,
  RefreshCw,
  Search,
  ChevronRight,
  Building2,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import { DashboardData } from '../../types';
import { useToast } from '../../context/ToastContext';

interface DashboardViewProps {
  onNavigate: (route: string, id?: string) => void;
}

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#64748b'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Aggregating government library metrics & statistics...</p>
      </div>
    );
  }

  const stats = data.stats;
  const category_breakdown = data.category_breakdown || data.charts?.category_distribution || [];
  const circulation_trend = data.circulation_trend || data.charts?.circulation_trend || [];
  const recent_issues = data.recent_issues || [];
  const recent_returns = data.recent_returns || [];
  const urgent_overdue = data.urgent_overdue || data.urgent_overdues || [];

  const statusDonutData = [
    { name: 'Available on Shelf', value: stats.available_books },
    { name: 'Currently Issued', value: stats.issued_books },
    { name: 'Overdue Books', value: stats.overdue_books },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              District Central Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">NODE #GK-01</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
            Government Public Library Management Dashboard
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time circulation overview, accession catalog statistics, student registrations, and automated OCR digitization desk.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('ocr-scanner')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            <span>Digital OCR Scanner</span>
          </button>

          <button
            onClick={() => onNavigate('issue-book')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Book</span>
          </button>

          <button
            onClick={fetchDashboard}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Real-time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div
          onClick={() => onNavigate('members')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">Total Members</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{stats.total_members}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">+{stats.recent_members_30_days} in last 30 days</p>
          </div>
        </div>

        {/* Total Books */}
        <div
          onClick={() => onNavigate('books')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">Total Cataloged</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{stats.total_books}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">+{stats.recent_books_30_days} new acquisitions</p>
          </div>
        </div>

        {/* Available Books */}
        <div
          onClick={() => onNavigate('books')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">Available on Shelf</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700">{stats.available_books}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">Ready for patron issue</p>
          </div>
        </div>

        {/* Issued Books */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">Currently Issued</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700">{stats.issued_books}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">Active patron loans</p>
          </div>
        </div>

        {/* Overdue Books */}
        <div
          onClick={() => onNavigate('overdue')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-rose-700 tracking-wider">Overdue Loans</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-700">{stats.overdue_books}</span>
            <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Needs fine recovery</p>
          </div>
        </div>

        {/* Total Circulation Transactions */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">Total Transactions</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{stats.total_transactions}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">Cumulative loan events</p>
          </div>
        </div>

        {/* Recent Books (30d) */}
        <div
          onClick={() => onNavigate('books/add')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">New Books (30d)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <CalendarPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">+{stats.recent_books_30_days}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">Add to catalog</p>
          </div>
        </div>

        {/* Recent Members (30d) */}
        <div
          onClick={() => onNavigate('members/add')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">New Patrons (30d)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">+{stats.recent_members_30_days}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">Register new student</p>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circulation Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Monthly Circulation Velocity (Issues vs Returns)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track borrowing volumes across consecutive operating months.
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circulation_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="issues" name="Books Issued" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" name="Books Returned" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Books By Category & Status Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Catalog Holdings by Category</span>
            </h2>
            <p className="text-xs text-slate-500">Distribution across competitive exams, Kannada literature & general.</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={category_breakdown} margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category_name" type="category" tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Books" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick status breakdown progress chips */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Available</span>
              <span className="text-base font-extrabold text-emerald-900">{stats.available_books}</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Issued</span>
              <span className="text-base font-extrabold text-amber-900">{stats.issued_books}</span>
            </div>
            <div className="p-2 bg-rose-50 rounded-xl">
              <span className="text-[10px] text-rose-700 font-bold uppercase block">Overdue</span>
              <span className="text-base font-extrabold text-rose-900">{stats.overdue_books}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Overdue Alert Card if any */}
      {urgent_overdue.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600 animate-pulse" />
              <h2 className="font-bold text-sm text-rose-900">
                Action Required: Urgent Overdue Book Loans ({urgent_overdue.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('overdue')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>View All Overdue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgent_overdue.map((tx) => (
              <div key={tx.id} className="bg-white p-3.5 rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div>
                  <p className="font-bold text-slate-900">{tx.book_title}</p>
                  <p className="text-slate-500 font-mono text-[11px]">Due: {tx.due_date} • Borrower: {tx.member_name}</p>
                </div>
                <button
                  onClick={() => onNavigate('return-book')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shrink-0"
                >
                  Receive Return
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Issues & Recent Returns Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <span>Recent Book Issues</span>
            </h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Book</th>
                  <th className="py-2.5 px-4">Patron</th>
                  <th className="py-2.5 px-4">Issued On</th>
                  <th className="py-2.5 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recent_issues.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 truncate max-w-[140px]">{tx.book_title}</td>
                    <td className="py-2.5 px-4">{tx.member_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{tx.issue_date}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{tx.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Returns */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Recent Returns Received</span>
            </h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Book</th>
                  <th className="py-2.5 px-4">Patron</th>
                  <th className="py-2.5 px-4">Returned On</th>
                  <th className="py-2.5 px-4">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recent_returns.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 truncate max-w-[140px]">{tx.book_title}</td>
                    <td className="py-2.5 px-4">{tx.member_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{tx.return_date || '-'}</td>
                    <td className="py-2.5 px-4 font-mono font-bold">
                      {tx.fine_amount ? <span className="text-rose-600">₹{tx.fine_amount}</span> : '₹0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
