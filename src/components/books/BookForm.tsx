import React, { useState, useEffect } from 'react';
import {
  BookPlus,
  ScanLine,
  FileEdit,
  Sparkles,
  ArrowLeft,
  Upload,
  BookOpen,
  Hash,
  Layers,
  Calendar,
  Globe,
  FileText,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Book, Category, ExtractedBookData } from '../../types';
import { OCRScannerComponent } from '../ocr/OCRScannerComponent';

interface BookFormProps {
  bookId?: string; // If editing
  initialData?: ExtractedBookData; // If coming from OCR scanner
  initialTab?: 'manual' | 'ocr';
  onNavigate: (route: string, id?: string) => void;
}

export const BookForm: React.FC<BookFormProps> = ({
  bookId,
  initialData,
  initialTab,
  onNavigate
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(bookId);

  // Tabs: 'manual' vs 'ocr'
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>(initialTab || (initialData ? 'manual' : 'manual'));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // Form fields
  const [bookNumber, setBookNumber] = useState(initialData?.book_number || '');
  const [title, setTitle] = useState(initialData?.book_name || '');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [publisher, setPublisher] = useState(initialData?.publisher || '');
  const [categoryId, setCategoryId] = useState(initialData?.category || '');
  const [language, setLanguage] = useState(initialData?.language || 'Kannada');
  const [publicationYear, setPublicationYear] = useState<number | string>(initialData?.publication_year || 2025);
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [shelfLocation, setShelfLocation] = useState('Rack A-01');
  const [status, setStatus] = useState<'AVAILABLE' | 'ISSUED' | 'DAMAGED' | 'LOST'>('AVAILABLE');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [digitalFileUrl, setDigitalFileUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(isEditing);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data || []);
        if (data && data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch next book number if new
  const fetchNextBookNumber = async () => {
    try {
      const res = await fetch('/api/books/next-number');
      const data = await res.json();
      if (data.next_number) {
        setBookNumber(data.next_number);
        showToast('info', 'Auto Assigned', `Next accession code assigned: ${data.next_number}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If editing, load existing data
  useEffect(() => {
    if (bookId) {
      setIsFetchingInitial(true);
      fetch(`/api/books/${bookId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setBookNumber(data.book_number);
            setTitle(data.title);
            setAuthor(data.author);
            setPublisher(data.publisher || '');
            setCategoryId(data.category_id);
            setLanguage(data.language || 'English');
            setPublicationYear(data.publication_year || '');
            setIsbn(data.isbn || '');
            setShelfLocation(data.shelf_location || 'Rack A-01');
            setStatus(data.status || 'AVAILABLE');
            setDescription(data.description || '');
            setCoverImageUrl(data.cover_image_url || '');
            setDigitalFileUrl(data.digital_file_url || '');
          }
        })
        .catch(err => {
          showToast('error', 'Error', 'Failed to load book data');
        })
        .finally(() => setIsFetchingInitial(false));
    } else if (!initialData && !bookNumber) {
      fetchNextBookNumber();
    }
  }, [bookId]);

  // Handle OCR scan completion
  const handleOcrPopulate = (extracted: ExtractedBookData) => {
    if (extracted.book_number) setBookNumber(extracted.book_number);
    if (extracted.book_name) setTitle(extracted.book_name);
    if (extracted.author) setAuthor(extracted.author);
    if (extracted.publisher) setPublisher(extracted.publisher);
    if (extracted.language) setLanguage(extracted.language);
    if (extracted.publication_year) setPublicationYear(extracted.publication_year);
    if (extracted.isbn) setIsbn(extracted.isbn);
    if (extracted.description) setDescription(extracted.description);

    // Try matching category
    if (extracted.category && categories.length > 0) {
      const match = categories.find(c => c.name.toLowerCase().includes(extracted.category!.toLowerCase()));
      if (match) setCategoryId(match.id);
    }

    setActiveTab('manual');
    showToast('success', 'Catalog Fields Populated', 'OCR data successfully placed in book catalog form for review.');
  };

  const handleClear = () => {
    setTitle('');
    setAuthor('');
    setPublisher('');
    setIsbn('');
    setDescription('');
    if (!isEditing) fetchNextBookNumber();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Validation Error', 'Book title is required.');
      return;
    }
    if (!bookNumber.trim()) {
      showToast('error', 'Validation Error', 'Book accession number is required.');
      return;
    }
    if (!author.trim()) {
      showToast('error', 'Validation Error', 'Author name is required.');
      return;
    }
    if (!categoryId) {
      showToast('error', 'Validation Error', 'Please select a catalog category.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        book_number: bookNumber.trim(),
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim() || undefined,
        category_id: categoryId,
        language: language.trim() || 'English',
        publication_year: publicationYear ? Number(publicationYear) : undefined,
        isbn: isbn.trim() || undefined,
        shelf_location: shelfLocation.trim() || 'Rack A-01',
        status,
        description: description.trim() || undefined,
        cover_image_url: coverImageUrl || undefined,
        digital_file_url: digitalFileUrl || undefined,
      };

      const url = isEditing ? `/api/books/${bookId}` : '/api/books';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save book catalog record');
      }

      showToast(
        'success',
        isEditing ? 'Book Record Updated' : 'Book Added to Catalog',
        `Book '${title}' (${bookNumber}) has been cataloged.`
      );

      onNavigate('books/detail', data.id || bookId);
    } catch (err: any) {
      showToast('error', 'Save Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingInitial) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        <span className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></span>
        <p className="font-semibold text-slate-700 dark:text-slate-200">Loading catalog record...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="book-form-back-btn"
          type="button"
          onClick={() => onNavigate('books')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mode:</span>
          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700">
            {isEditing ? 'Editing Catalog Record' : 'New Book Entry'}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Method Selector Tabs */}
        {!isEditing && (
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Book Catalog Entry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Scan physical accession register ledger cards or enter metadata manually.
              </p>
            </div>

            <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 p-1 bg-slate-200/60 dark:bg-slate-800 shadow-inner">
              <button
                id="tab-manual-book"
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>

              <button
                id="tab-ocr-book"
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ocr'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan with OCR</span>
                <Sparkles className="w-3 h-3 text-amber-900" />
              </button>
            </div>
          </div>
        )}

        {/* OCR TAB */}
        {activeTab === 'ocr' && !isEditing && (
          <div className="p-6">
            <OCRScannerComponent
              initialMode="BOOK"
              onUseForBook={handleOcrPopulate}
            />
          </div>
        )}

        {/* MANUAL FORM TAB */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Accession Number */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Book / Accession Number <span className="text-rose-500">*</span>
                  </label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={fetchNextBookNumber}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Auto-Generate Next
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="book_number_input"
                    type="text"
                    required
                    value={bookNumber}
                    onChange={(e) => setBookNumber(e.target.value)}
                    placeholder="B-001500"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                  />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Language of Text <span className="text-rose-500">*</span>
                </label>
                <select
                  id="book_language_select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                >
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Book Name / Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="book_title_input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter complete title (e.g. Samagra Kannada Sahitya Charitre)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                  />
                </div>
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Author / Editor <span className="text-rose-500">*</span>
                </label>
                <input
                  id="book_author_input"
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Dr. M. Chidananda Murthy"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>

              {/* Publisher */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Publisher Name
                </label>
                <input
                  id="book_publisher_input"
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Kannada Sahitya Parishat / Sapna"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Classification / Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="book_category_select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Publication Year */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Publication Year
                </label>
                <input
                  id="book_pub_year_input"
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  placeholder="2025"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>

              {/* ISBN */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  ISBN Number
                </label>
                <input
                  id="book_isbn_input"
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-81-..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>

              {/* Shelf Location */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Physical Shelf / Rack Location
                </label>
                <input
                  id="book_shelf_input"
                  type="text"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  placeholder="Rack A-01, Section B"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Physical Condition / Availability
                </label>
                <select
                  id="book_status_select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                >
                  <option value="AVAILABLE">AVAILABLE (On Shelf)</option>
                  <option value="ISSUED">ISSUED (Currently on loan)</option>
                  <option value="DAMAGED">DAMAGED (Under restoration)</option>
                  <option value="LOST">LOST / Missing</option>
                </select>
              </div>

              {/* Description / Summary */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Book Synopsis / Table of Contents Summary
                </label>
                <textarea
                  id="book_desc_input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of topics, subject coverage, or edition details..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('books')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  id="submit-book-btn"
                  type="submit"
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isLoading && <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                  <BookPlus className="w-4 h-4" />
                  <span>{isEditing ? 'Save Book Changes' : 'Catalog Book'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
