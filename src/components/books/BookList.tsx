import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BookPlus,
  ScanLine,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  Download
} from 'lucide-react';
import { Book, Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { DigitalReaderModal } from './DigitalReaderModal';
import { exportToCSV } from '../../utils/exportUtils';

interface BookListProps {
  onNavigate: (route: string, id?: string) => void;
}

export const BookList: React.FC<BookListProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Digital Reader modal
  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [readerModalOpen, setReaderModalOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (e) {
      // ignore
    }
  };

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category_id: categoryFilter,
        status: statusFilter,
        language: languageFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: String(page),
        limit: viewMode === 'grid' ? '12' : '10'
      });

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      setBooks(data.books || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load library catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, categoryFilter, statusFilter, languageFilter, sortBy, sortOrder, page, viewMode]);

  const handleExportCSV = () => {
    if (books.length === 0) {
      showToast('warning', 'No Books', 'No books available to export.');
      return;
    }
    exportToCSV(
      books,
      `government_library_catalog_${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'book_number', label: 'Accession / Book Number' },
        { key: 'title', label: 'Book Title' },
        { key: 'author', label: 'Author' },
        { key: 'category_name', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'publisher', label: 'Publisher' },
        { key: 'publication_year', label: 'Publication Year' },
        { key: 'shelf_location', label: 'Shelf Location' },
        { key: 'status', label: 'Availability Status' }
      ]
    );
    showToast('info', 'Export Started', 'Books catalog exported to CSV.');
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/books/${bookToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove book');
      }
      showToast('success', 'Book Removed', `Book '${bookToDelete.title}' (${bookToDelete.book_number}) was removed from active catalog.`);
      setDeleteModalOpen(false);
      setBookToDelete(null);
      fetchBooks();
    } catch (err: any) {
      showToast('error', 'Cannot Delete', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openReader = (book: Book) => {
    setReaderBook(book);
    setReaderModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Library Catalog & Accession Registry
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage physical books, digital preservation archives, Kannada literature, and reference volumes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="export-books-csv-btn"
            onClick={handleExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            id="books-scan-accession-btn"
            onClick={() => onNavigate('books/scan')}
            className="bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Accession Record</span>
          </button>

          <button
            id="books-add-btn"
            onClick={() => onNavigate('books/add')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookPlus className="w-4 h-4" />
            <span>Add Book Manually</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="books-search-input"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by book title, accession code (B-00...), author, publisher, ISBN..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={fetchBooks}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Refresh Books"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Multi-Filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={languageFilter}
              onChange={(e) => { setLanguageFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Languages</option>
              <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Sanskrit">Sanskrit</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available for Issue</option>
              <option value="ISSUED">Currently Issued</option>
              <option value="DAMAGED">Under Repair / Damaged</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
            >
              <option value="date_added-desc">Recently Added First</option>
              <option value="title-asc">Title (A to Z)</option>
              <option value="publication_year-desc">Newest Publication Year</option>
              <option value="book_number-asc">Accession No (Ascending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Display: Grid vs Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">Retrieving library catalog...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No books found matching your criteria.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try broadening your search filters or add a new book to the catalog.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Badge & Accession No */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {book.book_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      book.status === 'AVAILABLE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : book.status === 'ISSUED'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {book.status}
                  </span>
                </div>

                {/* Book Visual / Cover & Details */}
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-22 rounded-lg bg-slate-900 text-amber-400 flex flex-col items-center justify-center p-2 text-center shrink-0 border border-slate-800 shadow-inner">
                    <BookOpen className="w-5 h-5 mb-1 opacity-80" />
                    <span className="text-[9px] font-bold line-clamp-2 uppercase font-serif text-amber-200">
                      {book.language}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onNavigate('books/detail', book.id)}
                      className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 text-left leading-snug cursor-pointer"
                    >
                      {book.title}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      By {book.author}
                    </p>
                    <span className="inline-block text-[10px] text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded mt-1.5">
                      {book.category_name || 'General'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <div className="flex justify-between">
                    <span>Publisher:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{book.publisher || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{book.publication_year || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shelf:</span>
                    <span className="font-medium font-mono text-slate-700 dark:text-slate-300">{book.shelf_location || 'A-01'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => openReader(book)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 font-bold py-1.5 px-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Read Digital Manuscript / PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Read</span>
                </button>

                {book.status === 'AVAILABLE' && (
                  <button
                    onClick={() => onNavigate('issue-book')}
                    className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold p-1.5 rounded-lg text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    title="Issue This Book"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onNavigate('books/detail', book.id)}
                  className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Full Catalog Record"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('books/edit', book.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Edit Catalog Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setBookToDelete(book);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Delete Book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-4">Book No</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Shelf</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{book.book_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      <button
                        onClick={() => onNavigate('books/detail', book.id)}
                        className="hover:text-amber-600 dark:hover:text-amber-400 text-left cursor-pointer"
                      >
                        {book.title}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{book.author}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                        {book.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{book.language}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{book.shelf_location || 'A-01'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          book.status === 'AVAILABLE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : book.status === 'ISSUED'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openReader(book)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg cursor-pointer"
                          title="Open Digital Reader"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('books/detail', book.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('books/edit', book.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                          title="Edit Book"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setBookToDelete(book);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Showing Page {page} of {totalPages} ({totalCount} total cataloged books)
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Book Removal"
        message={`Are you sure you want to remove '${bookToDelete?.title}' (Accession No: ${bookToDelete?.book_number})? Books that are currently issued cannot be deleted.`}
        confirmText="Remove Book"
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setBookToDelete(null);
        }}
        isLoading={isDeleting}
      />

      {/* Digital E-Reader Modal */}
      <DigitalReaderModal
        isOpen={readerModalOpen}
        book={readerBook}
        onClose={() => {
          setReaderModalOpen(false);
          setReaderBook(null);
        }}
      />
    </div>
  );
};
