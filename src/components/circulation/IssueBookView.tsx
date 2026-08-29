import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  User,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Member, Book } from '../../types';
import { useToast } from '../../context/ToastContext';

interface IssueBookViewProps {
  onNavigate: (route: string, id?: string) => void;
}

export const IssueBookView: React.FC<IssueBookViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();

  // Search queries
  const [memberQuery, setMemberQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');

  // Selected entities
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Search Results
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [bookResults, setBookResults] = useState<Book[]>([]);

  // Member current active loans count
  const [memberActiveLoanCount, setMemberActiveLoanCount] = useState<number>(0);

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDue);

  const [isLoading, setIsLoading] = useState(false);

  // Search members
  useEffect(() => {
    if (!memberQuery.trim()) {
      setMemberResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/members?search=${encodeURIComponent(memberQuery)}&limit=5`)
        .then(res => res.json())
        .then(data => setMemberResults(data.members || []))
        .catch(console.error);
    }, 200);
    return () => clearTimeout(timer);
  }, [memberQuery]);

  // Search available books
  useEffect(() => {
    if (!bookQuery.trim()) {
      setBookResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/books?search=${encodeURIComponent(bookQuery)}&status=AVAILABLE&limit=5`)
        .then(res => res.json())
        .then(data => setBookResults(data.books || []))
        .catch(console.error);
    }, 200);
    return () => clearTimeout(timer);
  }, [bookQuery]);

  // When a member is selected, check active loans
  useEffect(() => {
    if (selectedMember) {
      fetch(`/api/transactions?member_id=${selectedMember.id}&status=ISSUED`)
        .then(res => res.json())
        .then(data => {
          setMemberActiveLoanCount(data.pagination?.total || (data.transactions || []).length);
        })
        .catch(console.error);
    }
  }, [selectedMember]);

  const handleIssue = async () => {
    if (!selectedMember) {
      showToast('error', 'Member Required', 'Please select a registered library member.');
      return;
    }
    if (!selectedBook) {
      showToast('error', 'Book Required', 'Please select an available library book.');
      return;
    }

    if (selectedMember.status !== 'ACTIVE') {
      showToast('error', 'Member Ineligible', `Member status is ${selectedMember.status}. Cannot issue books.`);
      return;
    }

    if (memberActiveLoanCount >= 3) {
      showToast('error', 'Loan Limit Exceeded', 'Member has reached maximum limit of 3 borrowed books.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/transactions/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          book_id: selectedBook.id,
          issue_date: issueDate,
          due_date: dueDate,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue book');
      }

      showToast(
        'success',
        'Book Issued Successfully',
        `'${selectedBook.title}' issued to ${selectedMember.student_name} (Due: ${dueDate}).`
      );

      onNavigate('transactions');
    } catch (err: any) {
      showToast('error', 'Issue Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Circulation Desk: Issue Library Book
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loan catalog books to verified patrons under standard 14-day government library policy.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('transactions')}
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          View Transactions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Member Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">1</span>
              <span>Select Library Member</span>
            </h2>
            {selectedMember && (
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Change Member
              </button>
            )}
          </div>

          {!selectedMember ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="issue-member-search"
                  type="text"
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search member by Name, Reg No (LIB-2026-...), or Mobile..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850"
                />
              </div>

              {/* Live search results */}
              {memberResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto bg-white dark:bg-slate-850 shadow-md">
                  {memberResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberQuery('');
                        setMemberResults([]);
                      }}
                      className="w-full p-3 text-left hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{m.student_name}</p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{m.registration_number} • {m.village}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}>
                        {m.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {memberQuery && memberResults.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">No members found with that search term.</p>
              )}
            </div>
          ) : (
            /* Selected Member Card */
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                  {selectedMember.registration_number}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Member
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedMember.student_name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Village: {selectedMember.village} | Mobile: {selectedMember.mobile}</p>

              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Active Loans:</span>
                <span className="font-bold text-slate-900 dark:text-white">{memberActiveLoanCount} / 3 Books</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Book Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">2</span>
              <span>Select Available Book</span>
            </h2>
            {selectedBook && (
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Change Book
              </button>
            )}
          </div>

          {!selectedBook ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="issue-book-search"
                  type="text"
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="Search by Title, Book No (B-00...), or Author..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850"
                />
              </div>

              {/* Live Book search results */}
              {bookResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto bg-white dark:bg-slate-850 shadow-md">
                  {bookResults.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBook(b);
                        setBookQuery('');
                        setBookResults([]);
                      }}
                      className="w-full p-3 text-left hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{b.title}</p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{b.book_number} • By {b.author}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Available
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {bookQuery && bookResults.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">No available books matched your search.</p>
              )}
            </div>
          ) : (
            /* Selected Book Card */
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                  {selectedBook.book_number}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  {selectedBook.language}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{selectedBook.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">By {selectedBook.author} | Shelf: {selectedBook.shelf_location || 'Rack A-01'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Loan Dates & Confirmation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6 transition-colors">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">3</span>
          <span>Set Loan Dates & Issue Confirmation</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Issue Date
            </label>
            <input
              id="issue-date-input"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Expected Due Date (Standard 14 Days)
            </label>
            <input
              id="due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Loan Policy Summary Notice */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Circulation Policy Rules:</p>
            <p className="mt-0.5">
              Patrons are granted a 14-day borrowing period. An automated late fine of <strong>₹2 per day</strong> is levied on overdue loans.
            </p>
          </div>
        </div>

        {/* Issue Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="confirm-issue-book-btn"
            type="button"
            onClick={handleIssue}
            disabled={!selectedMember || !selectedBook || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            <ArrowUpRight className="w-4 h-4" />
            <span>Confirm & Issue Book</span>
          </button>
        </div>
      </div>
    </div>
  );
};
