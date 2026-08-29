import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Layers,
  Globe,
  Edit2,
  Trash2,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Book, Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { DigitalReaderModal } from './DigitalReaderModal';

interface BookDetailProps {
  bookId: string;
  onNavigate: (route: string, id?: string) => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({ bookId, onNavigate }) => {
  const { showToast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [readerOpen, setReaderOpen] = useState(false);

  const fetchBookData = async () => {
    setIsLoading(true);
    try {
      const [resBook, resTx] = await Promise.all([
        fetch(`/api/books/${bookId}`),
        fetch(`/api/transactions?book_id=${bookId}&limit=50`)
      ]);

      const bookData = await resBook.json();
      const txData = await resTx.json();

      if (resBook.ok) {
        setBook(bookData);
      } else {
        throw new Error(bookData.error || 'Book not found');
      }

      setTransactions(txData.transactions || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  const handleDeleteBook = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete book');
      }
      showToast('success', 'Book Removed', 'Book record removed from catalog.');
      onNavigate('books');
    } catch (err: any) {
      showToast('error', 'Deletion Error', err.message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleReturnDirect = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/return/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'Direct return from catalog page' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to return book');
      }
      showToast('success', 'Book Returned', 'Book is now marked as AVAILABLE in catalog.');
      fetchBookData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handlePrintRecord = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-200">Loading catalog record & circulation status...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-300 font-bold">Book catalog entry not found.</p>
        <button
          onClick={() => onNavigate('books')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
        >
          Return to Books Catalog
        </button>
      </div>
    );
  }

  const currentActiveLoan = transactions.find(t => t.status === 'ISSUED' || t.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          id="book-detail-back-btn"
          type="button"
          onClick={() => onNavigate('books')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Books Catalog</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="print-book-record-btn"
            onClick={handlePrintRecord}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Print Accession Slip</span>
          </button>

          <button
            id="open-reader-btn"
            onClick={() => setReaderOpen(true)}
            className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors border border-slate-700 dark:border-slate-600 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Open Digital Reader</span>
          </button>

          {book.status === 'AVAILABLE' && (
            <button
              id="issue-book-btn"
              onClick={() => onNavigate('issue-book')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Issue This Book</span>
            </button>
          )}

          <button
            id="edit-book-btn"
            onClick={() => onNavigate('books/edit', book.id)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Catalog</span>
          </button>

          <button
            id="delete-book-btn"
            onClick={() => setDeleteModalOpen(true)}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
            title="Delete Book"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Book Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          {/* Book Spine / Visual */}
          <div className="w-28 h-40 rounded-xl bg-slate-900 dark:bg-slate-950 text-amber-400 flex flex-col items-center justify-center p-3 text-center shrink-0 border border-slate-800 shadow-md">
            <BookOpen className="w-8 h-8 mb-2 opacity-80" />
            <span className="text-xs font-bold uppercase font-serif text-amber-200 line-clamp-2">
              {book.language}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-2">
              {book.book_number}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                Accession No: {book.book_number}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  book.status === 'AVAILABLE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : book.status === 'ISSUED'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {book.status}
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded">
                {book.category_name || 'General Collection'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
              By {book.author}
            </p>

            {/* Synopsis */}
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-3xl bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {book.description || 'This volume is cataloged under the public library accession scheme for public circulation, reference, and academic preservation.'}
            </p>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Publisher</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{book.publisher || 'Not Specified'}</span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Publication Year</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{book.publication_year || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">ISBN</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{book.isbn || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Shelf / Rack</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{book.shelf_location || 'Rack A-01'}</span>
          </div>
        </div>
      </div>

      {/* Current Borrower Status Card if currently issued */}
      {currentActiveLoan && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider">
                  Currently Issued To Member
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {currentActiveLoan.member_name} ({currentActiveLoan.member_reg_number})
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span>Issued: <strong>{currentActiveLoan.issue_date}</strong></span>
                  <span>Due Date: <strong className={currentActiveLoan.status === 'OVERDUE' ? 'text-rose-600 dark:text-rose-400' : ''}>{currentActiveLoan.due_date}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleReturnDirect(currentActiveLoan.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Process Book Return</span>
            </button>
          </div>
        </div>
      )}

      {/* Circulation History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            Circulation Log History ({transactions.length} Total Loans)
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
            <p>No recorded loans for this book yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Reg Number</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{tx.member_name}</td>
                    <td className="py-3 px-4 font-mono">{tx.member_reg_number}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.issue_date}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.return_date || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'RETURNED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : tx.status === 'OVERDUE'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {tx.fine_amount ? `₹${tx.fine_amount}` : '₹0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Book Removal"
        message={`Are you sure you want to remove '${book.title}' (${book.book_number})? This action cannot be undone.`}
        confirmText="Remove Book"
        onConfirm={handleDeleteBook}
        onClose={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />

      <DigitalReaderModal
        isOpen={readerOpen}
        book={book}
        onClose={() => setReaderOpen(false)}
      />
    </div>
  );
};
