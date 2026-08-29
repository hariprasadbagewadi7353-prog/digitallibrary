import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Users,
  ArrowRightLeft,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Edit2,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { Book, Member, Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';

interface GlobalSearchViewProps {
  onNavigate: (route: string, id?: string, extra?: any) => void;
}

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'members' | 'transactions'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [results, setResults] = useState<{
    books: Book[];
    members: Member[];
    transactions: Transaction[];
  }>({
    books: [],
    members: [],
    transactions: []
  });

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults({
        books: data.books || [],
        members: data.members || [],
        transactions: data.transactions || []
      });
    } catch (err) {
      console.error(err);
      showToast('error', 'Search Error', 'Failed to complete search query.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const totalResultsCount =
    results.books.length + results.members.length + results.transactions.length;

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Global Library Search Engine
              </h1>
              <p className="text-xs text-slate-500">
                Instantly query books, patron memberships, accession codes, registration numbers, and circulation ledgers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
            {totalResultsCount} Matches Found
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-amber-500 absolute left-4 top-3.5" />
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Book Title, Accession Code (e.g. LIB-001), Member Name, Reg No (e.g. MEM-001), Village, Author, ISBN..."
            className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all shadow-inner"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Quick suggestions:</span>
          {['Kuvempu', 'Gokak', 'LIB-001', 'MEM-001', 'Kannada', 'Science', 'Belagavi'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 rounded-lg text-xs transition-colors border border-slate-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Results</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/10 text-[10px]">
              {totalResultsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'books'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Books Catalog</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/10 text-[10px]">
              {results.books.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members & Patrons</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/10 text-[10px]">
              {results.members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Circulation Records</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/10 text-[10px]">
              {results.transactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Results Container */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Querying digital library records...</p>
        </div>
      ) : totalResultsCount === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">No Matching Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try searching with broader terms or check the spelling of the book title, author, or student registration code.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Books Section */}
          {(activeTab === 'all' || activeTab === 'books') && results.books.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Books Catalog ({results.books.length})
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('books')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  View All in Catalog →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.books.map((book) => (
                  <div
                    key={book.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                          {book.book_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            book.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {book.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{book.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Author: {book.author}</p>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{book.language}</span> • <span>Shelf: {book.shelf_location}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onNavigate('books/detail', book.id)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('books/edit', book.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
                          title="Edit Book"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {book.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => onNavigate('issue-book')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Issue</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigate('return-book')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {(activeTab === 'all' || activeTab === 'members') && results.members.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Members & Patrons ({results.members.length})
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('members')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  View All Members →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded">
                          {member.registration_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            member.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{member.student_name}</h3>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.village} {member.pincode ? `(${member.pincode})` : ''}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.mobile}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onNavigate('members/detail', member.id)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('members/edit', member.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onNavigate('issue-book')}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Issue Loan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Section */}
          {(activeTab === 'all' || activeTab === 'transactions') && results.transactions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Circulation & Loan History ({results.transactions.length})
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('transactions')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  View Full History →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-3 px-3">Transaction ID</th>
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3">Book</th>
                      <th className="py-3 px-3">Issue Date</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{tx.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{tx.member_name}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{tx.book_title}</td>
                        <td className="py-2.5 px-3 text-slate-500">{tx.issue_date}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">{tx.due_date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'ISSUED'
                                ? 'bg-amber-100 text-amber-800'
                                : tx.status === 'RETURNED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {tx.status === 'ISSUED' && (
                            <button
                              onClick={() => onNavigate('return-book')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[11px]"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
