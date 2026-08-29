import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  Search,
  BookOpen,
  User,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  Clock,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ReturnBookViewProps {
  onNavigate: (route: string, id?: string) => void;
}

export const ReturnBookView: React.FC<ReturnBookViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Return Processing
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [remarks, setRemarks] = useState('Returned in good condition');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchActiveLoans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions?status=ISSUED&search=${encodeURIComponent(search)}&limit=50`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load active loan records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, [search]);

  // Calculate live overdue days and fine
  const calculateOverdueDetails = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        isOverdue: true,
        daysOverdue: diffDays,
        fine: diffDays * 2 // ₹2 per day fine
      };
    }
    return {
      isOverdue: false,
      daysOverdue: 0,
      fine: 0
    };
  };

  const handleReturn = async (tx: Transaction) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/transactions/return/${tx.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }

      showToast(
        'success',
        'Book Returned',
        `'${tx.book_title}' has been returned by ${tx.member_name}. Fine: ₹${data.fine_amount || 0}.`
      );

      setSelectedTx(null);
      fetchActiveLoans();
    } catch (err: any) {
      showToast('error', 'Return Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              Circulation Desk: Return Book Registry
            </h1>
            <p className="text-xs text-slate-500">
              Receive borrowed books back into shelf inventory, check overdue fines, and update patron loans.
            </p>
          </div>
        </div>

        <button
          onClick={fetchActiveLoans}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 self-end md:self-auto"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Search */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Member Name, Registration No (LIB-2026-...), or Book Accession No (B-00...)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Active Borrowed Books List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Borrowed Books Awaiting Return ({transactions.length})
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading active circulation loans...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700 text-sm">No books currently on loan.</p>
            <p className="mt-0.5">All issued library catalog books have been accounted for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Book No & Title</th>
                  <th className="py-3 px-4">Borrower Details</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Overdue Status</th>
                  <th className="py-3 px-4">Fine Estimate</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => {
                  const overdue = calculateOverdueDetails(tx.due_date);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{tx.book_title}</p>
                        <p className="font-mono text-[11px] text-slate-500">{tx.book_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{tx.member_name}</p>
                        <p className="font-mono text-[11px] text-amber-700">{tx.member_reg_number}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{tx.issue_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tx.due_date}
                      </td>
                      <td className="py-3 px-4">
                        {overdue.isOverdue ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse text-[10px]">
                            <AlertOctagon className="w-3 h-3" />
                            <span>{overdue.daysOverdue} Days Overdue</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            On Time
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {overdue.fine > 0 ? (
                          <span className="text-rose-600">₹{overdue.fine}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleReturn(tx)}
                          disabled={isProcessing}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Return Book</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
