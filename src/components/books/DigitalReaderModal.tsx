import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  Download,
  FileText,
  Eye
} from 'lucide-react';
import { Book } from '../../types';

interface DigitalReaderModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
}

export const DigitalReaderModal: React.FC<DigitalReaderModalProps> = ({
  isOpen,
  book,
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !book) return null;

  const totalPages = 14; // simulated document page length for preview

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div
        id="digital-reader-container"
        className="w-full max-w-5xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden text-slate-200"
      >
        {/* Top Reader Toolbar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate leading-tight">
                {book.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {book.author} | Book No: {book.book_number} | {book.language} Edition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setZoomLevel(z => Math.max(60, z - 15))}
                className="p-1.5 hover:text-white rounded hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(180, z + 15))}
                className="p-1.5 hover:text-white rounded hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors ml-2"
              title="Close Reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Canvas Body */}
        <div className="flex-1 bg-slate-950/60 overflow-auto p-4 sm:p-8 flex items-center justify-center">
          <div
            className="bg-amber-50/95 text-slate-900 shadow-2xl rounded-lg p-8 sm:p-12 max-w-2xl w-full min-h-[580px] border border-amber-200/60 transition-all font-serif flex flex-col justify-between"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top' }}
          >
            {/* Header in page */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-sans text-slate-500 pb-4 border-b border-slate-300 mb-6">
                <span>Government Digital Repository - Document #{book.book_number}</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              {/* Sample Page Content */}
              {currentPage === 1 ? (
                <div className="text-center py-12 space-y-4">
                  <span className="text-xs font-sans uppercase tracking-widest text-amber-800 font-bold bg-amber-200/60 px-3 py-1 rounded-full">
                    Official Digital Archive
                  </span>
                  <h1 className="text-3xl font-extrabold text-slate-950 font-serif leading-tight pt-4">
                    {book.title}
                  </h1>
                  <p className="text-lg text-slate-700 italic">
                    By {book.author}
                  </p>
                  <div className="pt-8 text-xs font-sans text-slate-600 space-y-1">
                    <p><strong>Publisher:</strong> {book.publisher || 'Government Central Press'}</p>
                    <p><strong>Language:</strong> {book.language}</p>
                    <p><strong>Accession Code:</strong> {book.book_number}</p>
                    <p><strong>ISBN:</strong> {book.isbn || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                  <h2 className="text-xl font-bold font-serif text-slate-900 border-b border-slate-200 pb-2">
                    Section {currentPage - 1}: Comprehensive Reference & Treatise
                  </h2>
                  <p className="indent-6">
                    {book.description || `This volume forms part of the government public library's permanent reference holdings. It serves as essential study material for academics, students preparing for competitive civil service examinations, and community patrons researching Karnataka literature, history, and development.`}
                  </p>
                  <p className="indent-6">
                    The digital preservation initiative ensures that rare volumes, regional publications, and educational textbooks remain accessible across rural and urban community study hubs without physical degradation.
                  </p>
                  <p className="indent-6">
                    Members may review this text within library digital kiosks. Physical copies may also be borrowed from the circulation desk upon presenting an active patron membership card.
                  </p>
                  <div className="p-4 bg-amber-100/60 rounded-lg border border-amber-300/50 text-xs font-sans mt-8">
                    <p className="font-bold text-amber-950">Library Catalog Summary Note:</p>
                    <p className="text-amber-900 mt-1">
                      Located in Section: <strong>{book.category_name || 'General Collection'}</strong> | Shelf Rack: <strong>{book.shelf_location || 'A-01'}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer in page */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[11px] font-sans text-slate-500">
              <span>Department of Public Libraries, Gokak</span>
              <span>Doc Ref: {book.book_number}-PG{currentPage}</span>
            </div>
          </div>
        </div>

        {/* Bottom Page Navigation Bar */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Page</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-12 text-center bg-slate-800 border border-slate-700 rounded py-1 text-white font-bold"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
