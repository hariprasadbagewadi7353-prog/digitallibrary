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
  DollarSign,
  X
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

  const handleConfirmReturn = async () => {
    if (!selectedTx) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/transactions/return/${selectedTx.id}`, {
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
        `'${selectedTx.book_title}' has been returned by ${selectedTx.member_name}. Fine: ₹${data.fine_amount || 0}.`
      );

      setSelectedTx(null);
      setRemarks('Returned in good condition');
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Circulation Desk: Return Book Registry
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Receive borrowed books back into shelf inventory, check overdue fines, and update patron loans.
            </p>
          </div>
        </div>

        <button
          onClick={fetchActiveLoans}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-end md:self-auto cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="return-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Member Name, Registration No (LIB-2026-...), or Book Accession No (B-00...)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850"
          />
        </div>
      </div>

      {/* Active Borrowed Books List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Active Borrowed Books Awaiting Return ({transactions.length})
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading active circulation loans...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No books currently on loan.</p>
            <p className="mt-0.5">All issued library catalog books have been accounted for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <th className="py-3 px-4">Book No & Title</th>
                  <th className="py-3 px-4">Borrower Details</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Overdue Status</th>
                  <th className="py-3 px-4">Fine Estimate</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {transactions.map((tx) => {
                  const overdue = calculateOverdueDetails(tx.due_date);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{tx.book_title}</p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{tx.book_number}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{tx.member_name}</p>
                        <p className="font-mono text-[11px] text-amber-700 dark:text-amber-400">{tx.member_reg_number}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.issue_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.due_date}
                      </td>
                      <td className="py-3 px-4">
                        {overdue.isOverdue ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 animate-pulse text-[10px]">
                            <AlertOctagon className="w-3 h-3" />
                            <span>{overdue.daysOverdue} Days Overdue</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            On Time
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {overdue.fine > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">₹{overdue.fine}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
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

      {/* Return Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-600" />
                <span>Confirm Book Return</span>
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Book</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.book_title}</span> ({selectedTx.book_number})
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Borrower</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.member_name}</span> ({selectedTx.member_reg_number})
              </div>
              <div className="flex justify-between pt-1">
                <span>Due Date: <strong>{selectedTx.due_date}</strong></span>
                {calculateOverdueDetails(selectedTx.due_date).isOverdue && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Late Fine: ₹{calculateOverdueDetails(selectedTx.due_date).fine}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Physical Condition Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="e.g. Good condition, cover intact, spine verified..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isProcessing && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Confirm Return</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
