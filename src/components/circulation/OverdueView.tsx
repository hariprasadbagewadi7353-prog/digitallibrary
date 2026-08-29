import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Phone,
  User,
  BookOpen,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  Printer,
  Search,
  RefreshCw,
  Mail,
  MapPin,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { exportToCSV } from '../../utils/exportUtils';
import { generateOverdueReportPDF } from '../../utils/pdfGenerator';

interface OverdueRecord {
  transaction_id: string;
  member_id: string;
  member_name: string;
  member_reg_number: string;
  member_mobile: string;
  member_village: string;
  book_id: string;
  book_title: string;
  book_number: string;
  issue_date: string;
  due_date: string;
  days_overdue: number;
  fine_amount: number;
}

export const OverdueView: React.FC = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<OverdueRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Notice print modal
  const [noticeRecord, setNoticeRecord] = useState<OverdueRecord | null>(null);

  const fetchOverdue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/overdue?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load overdue records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, [search]);

  const handleReturn = async (txId: string, title: string) => {
    try {
      const res = await fetch(`/api/transactions/return/${txId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'Overdue loan return cleared' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to return');

      showToast('success', 'Return Cleared', `Book '${title}' returned. Late fine recorded: ₹${data.fine_amount}`);
      fetchOverdue();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handlePrintSlip = (record: OverdueRecord) => {
    setNoticeRecord(record);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('warning', 'No Records', 'No overdue records to export.');
      return;
    }
    exportToCSV(
      records,
      `overdue_books_report_${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'member_name', label: 'Patron Name' },
        { key: 'member_reg_number', label: 'Registration Number' },
        { key: 'member_mobile', label: 'Mobile Phone' },
        { key: 'member_village', label: 'Village / Town' },
        { key: 'book_title', label: 'Book Title' },
        { key: 'book_number', label: 'Accession Number' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'days_overdue', label: 'Days Overdue' },
        { key: 'fine_amount', label: 'Fine Amount (INR)' }
      ]
    );
    showToast('info', 'Export Started', 'Overdue register exported to CSV.');
  };

  const handleDownloadPDF = () => {
    if (records.length === 0) {
      showToast('warning', 'No Records', 'No overdue records to export.');
      return;
    }
    try {
      generateOverdueReportPDF(records);
      showToast('success', 'PDF Generated', 'Official overdue recovery report downloaded.');
    } catch (err: any) {
      showToast('error', 'PDF Error', err.message);
    }
  };

  const handleSendWhatsAppReminder = (r: OverdueRecord) => {
    const text = encodeURIComponent(
      `*GOVERNMENT PUBLIC LIBRARY REMINDER*\n\nDear ${r.member_name} (${r.member_reg_number}),\n\nYour borrowed book *"${r.book_title}"* (Accession: ${r.book_number}) was due on *${r.due_date}* and is currently *${r.days_overdue} days overdue*.\n\nAccrued Late Fine: *₹${r.fine_amount}* (@ ₹2/day).\n\nPlease return the book to the library circulation desk at your earliest convenience to avoid suspension.\n\nThank you,\nChief Librarian`
    );
    const cleanMobile = r.member_mobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    window.open(`https://wa.me/${mobileWithCountry}?text=${text}`, '_blank');
  };

  const totalFineSum = records.reduce((acc, r) => acc + r.fine_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Overdue Loans & Fine Recovery Desk
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active loans exceeding the 14-day borrowing threshold with automatic fine calculation (₹2/day).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Total Overdue</span>
            <span className="text-lg font-bold text-rose-900 dark:text-rose-200">{records.length} Books</span>
          </div>

          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Accumulated Fines</span>
            <span className="text-lg font-bold text-amber-900 dark:text-amber-200">₹{totalFineSum}</span>
          </div>

          <button
            id="export-overdue-csv-btn"
            onClick={handleExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>CSV</span>
          </button>

          <button
            id="export-overdue-pdf-btn"
            onClick={handleDownloadPDF}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="overdue-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search overdue list by Patron Name, Reg No, or Book Title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850"
          />
        </div>

        <button
          onClick={fetchOverdue}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overdue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Auditing overdue transactions...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-90" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-base">No Overdue Books Found!</p>
            <p className="mt-1">All currently borrowed books are within the permitted loan period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  <th className="py-3.5 px-4">Patron / Student</th>
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Days Overdue</th>
                  <th className="py-3.5 px-4">Fine Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {records.map((r) => (
                  <tr key={r.transaction_id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{r.member_name}</p>
                      <p className="font-mono text-[11px] text-amber-800 dark:text-amber-400">{r.member_reg_number}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" /> {r.member_mobile} • {r.member_village}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{r.book_title}</p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{r.book_number}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{r.issue_date}</td>
                    <td className="py-3 px-4 font-bold text-rose-700 dark:text-rose-400">{r.due_date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 text-[10px]">
                        {r.days_overdue} Days Late
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700 dark:text-rose-400 text-sm">
                      ₹{r.fine_amount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendWhatsAppReminder(r)}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                          title="Send WhatsApp / SMS Reminder"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintSlip(r)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="Print Notice Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleReturn(r.transaction_id, r.book_title)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          <span>Clear & Return</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden printable official notice slip for window.print */}
      {noticeRecord && (
        <div id="printable-overdue-slip" className="hidden print:block p-8 font-serif text-black">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h2 className="text-xl font-bold">GOVERNMENT OF KARNATAKA</h2>
            <h3 className="text-base font-bold">DEPARTMENT OF PUBLIC LIBRARIES</h3>
            <p className="text-xs">Gokak City Central Library Branch | Official Overdue Reminder Slip</p>
          </div>

          <div className="space-y-3 text-sm">
            <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>To Patron:</strong> {noticeRecord.member_name} ({noticeRecord.member_reg_number})</p>
            <p><strong>Village / Town:</strong> {noticeRecord.member_village} | <strong>Mobile:</strong> {noticeRecord.member_mobile}</p>
            <p className="pt-2"><strong>Subject:</strong> Immediate return of overdue library property.</p>
            <p>You are hereby requested to return the following library book to the circulation desk:</p>
            <div className="p-3 border border-black my-2 font-mono text-xs">
              <p><strong>Book Title:</strong> {noticeRecord.book_title}</p>
              <p><strong>Accession Code:</strong> {noticeRecord.book_number}</p>
              <p><strong>Issue Date:</strong> {noticeRecord.issue_date} | <strong>Due Date:</strong> {noticeRecord.due_date}</p>
              <p><strong>Days Overdue:</strong> {noticeRecord.days_overdue} Days</p>
              <p><strong>Fine Accrued:</strong> ₹{noticeRecord.fine_amount}</p>
            </div>
            <p className="text-xs pt-4">Chief Librarian Signature & Stamp: ____________________________</p>
          </div>
        </div>
      )}
    </div>
  );
};
