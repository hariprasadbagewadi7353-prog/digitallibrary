import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  BookOpen,
  Users,
  ArrowRightLeft,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  FileText,
  Building2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { generateOfficialReportPDF } from '../../utils/pdfGenerator';
import { exportToCSV } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [reportType, setReportType] = useState<string>('books');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<{ label: string; value: string | number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getFilterDateRange = () => {
    const now = new Date();
    if (dateFilterMode === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      return { from: todayStr, to: todayStr, text: `Today (${todayStr})` };
    }
    if (dateFilterMode === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        from: lastWeek.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
        text: `Past 7 Days`
      };
    }
    if (dateFilterMode === 'month') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        from: lastMonth.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
        text: `Past 30 Days`
      };
    }
    if (dateFilterMode === 'custom' && (fromDate || toDate)) {
      return { from: fromDate, to: toDate, text: `${fromDate || 'Start'} to ${toDate || 'Present'}` };
    }
    return { from: '', to: '', text: 'All Records to Date' };
  };

  const fetchReportPreview = async () => {
    setIsLoading(true);
    try {
      const { from, to } = getFilterDateRange();
      let endpoint = '';

      if (reportType === 'books' || reportType === 'available_books' || reportType === 'issued_books') {
        const queryStatus = reportType === 'available_books' ? 'AVAILABLE' : reportType === 'issued_books' ? 'ISSUED' : statusFilter;
        endpoint = `/api/books?limit=200&status=${queryStatus}`;
      } else if (reportType === 'members' || reportType === 'new_members') {
        endpoint = `/api/members?limit=200&status=${statusFilter}`;
      } else if (reportType === 'active_loans') {
        endpoint = `/api/transactions?limit=200&status=ISSUED`;
      } else if (reportType === 'issue_history') {
        endpoint = `/api/transactions?limit=200&from_date=${from}&to_date=${to}`;
      } else if (reportType === 'overdue') {
        endpoint = `/api/overdue`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      let records: any[] = [];
      let metrics: { label: string; value: string | number }[] = [];

      if (reportType === 'books' || reportType === 'available_books' || reportType === 'issued_books') {
        records = data.books || [];
        const available = records.filter(b => b.status === 'AVAILABLE').length;
        const issued = records.filter(b => b.status === 'ISSUED').length;
        metrics = [
          { label: 'Total Cataloged', value: records.length },
          { label: 'Available on Shelf', value: available },
          { label: 'Currently Loaned', value: issued },
          { label: 'Unique Categories', value: new Set(records.map(b => b.category_name)).size }
        ];
      } else if (reportType === 'members' || reportType === 'new_members') {
        records = data.members || [];
        const active = records.filter(m => m.status === 'ACTIVE').length;
        const villages = new Set(records.map(m => m.village)).size;
        metrics = [
          { label: 'Total Members', value: records.length },
          { label: 'Active Patrons', value: active },
          { label: 'Villages Represented', value: villages },
          { label: 'Registration Rate', value: '100% Verified' }
        ];
      } else if (reportType === 'active_loans' || reportType === 'issue_history') {
        records = data.transactions || [];
        const returned = records.filter(t => t.status === 'RETURNED').length;
        const active = records.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE').length;
        metrics = [
          { label: 'Total Transactions', value: records.length },
          { label: 'Active Loans', value: active },
          { label: 'Returned Books', value: returned },
          { label: 'Completed Rate', value: records.length ? `${Math.round((returned / records.length) * 100)}%` : '0%' }
        ];
      } else if (reportType === 'overdue') {
        records = data.records || [];
        const totalFine = records.reduce((sum: number, r: any) => sum + (Number(r.fine_amount) || 0), 0);
        metrics = [
          { label: 'Overdue Books', value: records.length },
          { label: 'Total Fines (₹)', value: `₹${totalFine}` },
          { label: 'Longest Overdue', value: records.length ? `${Math.max(...records.map((r: any) => r.days_overdue || 0))} Days` : '0 Days' },
          { label: 'Recovery Status', value: 'Active Notices' }
        ];
      }

      setPreviewData(records);
      setSummaryMetrics(metrics);
    } catch (err) {
      console.error(err);
      showToast('error', 'Report Error', 'Failed to generate report dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportPreview();
  }, [reportType, statusFilter, dateFilterMode, fromDate, toDate]);

  const getReportTitle = () => {
    switch (reportType) {
      case 'books':
        return 'Official Accession & Catalog Inventory Ledger';
      case 'available_books':
        return 'Available Library Books Inventory Sheet';
      case 'issued_books':
      case 'active_loans':
        return 'Current Active Circulation & Loan Ledger';
      case 'members':
        return 'Registered Patron & Member Directory';
      case 'new_members':
        return 'New Patron Accession Ledger';
      case 'issue_history':
        return 'Historical Book Circulation & Return Audit Trail';
      case 'overdue':
        return 'Overdue Loans & Fine Recovery Register';
      default:
        return 'Official Library Circulation Report';
    }
  };

  const handleDownloadPDF = () => {
    if (previewData.length === 0) {
      showToast('warning', 'No Records', 'Cannot export an empty report dataset.');
      return;
    }
    try {
      const { text } = getFilterDateRange();
      generateOfficialReportPDF({
        reportType,
        reportTitle: getReportTitle(),
        generatedBy: user ? `${user.name} (${user.role})` : 'Chief Librarian',
        dateRangeText: text,
        summaryMetrics,
        data: previewData
      });
      showToast('success', 'PDF Export Complete', `Official PDF report downloaded successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast('error', 'PDF Error', err.message || 'Failed to generate PDF document.');
    }
  };

  const handleDownloadCSV = () => {
    if (previewData.length === 0) {
      showToast('warning', 'No Records', 'Cannot export an empty report dataset.');
      return;
    }

    let headers: { key: string; label: string }[] = [];
    if (reportType === 'books' || reportType === 'available_books' || reportType === 'issued_books') {
      headers = [
        { key: 'book_number', label: 'Book Number' },
        { key: 'title', label: 'Book Title' },
        { key: 'author', label: 'Author' },
        { key: 'category_name', label: 'Category' },
        { key: 'language', label: 'Language' },
        { key: 'shelf_location', label: 'Shelf Location' },
        { key: 'status', label: 'Status' }
      ];
    } else if (reportType === 'members' || reportType === 'new_members') {
      headers = [
        { key: 'registration_number', label: 'Registration Number' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'father_name', label: 'Father / Guardian' },
        { key: 'village', label: 'Village' },
        { key: 'pincode', label: 'Pincode' },
        { key: 'mobile', label: 'Mobile Number' },
        { key: 'email', label: 'Email' },
        { key: 'registration_date', label: 'Registration Date' },
        { key: 'status', label: 'Status' }
      ];
    } else if (reportType === 'overdue') {
      headers = [
        { key: 'student_name', label: 'Student Name' },
        { key: 'registration_number', label: 'Registration Number' },
        { key: 'member_mobile', label: 'Mobile Number' },
        { key: 'book_number', label: 'Book Number' },
        { key: 'book_title', label: 'Book Title' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'due_date', label: 'Expected Return Date' },
        { key: 'days_overdue', label: 'Days Overdue' },
        { key: 'fine_amount', label: 'Fine (INR)' }
      ];
    } else {
      headers = [
        { key: 'id', label: 'Transaction ID' },
        { key: 'book_number', label: 'Book Number' },
        { key: 'book_title', label: 'Book Title' },
        { key: 'student_name', label: 'Member Name' },
        { key: 'registration_number', label: 'Registration Number' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'return_date', label: 'Return Date' },
        { key: 'status', label: 'Status' },
        { key: 'fine_amount', label: 'Fine' }
      ];
    }

    exportToCSV(previewData, `${reportType}_report_${new Date().toISOString().slice(0, 10)}`, headers);
    showToast('info', 'Export Started', `Downloading ${reportType.toUpperCase()} spreadsheet.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Official Reports & Statistical Exports
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate government audit registries, member ledgers, catalog inventories, and overdue recovery sheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="print-report-button"
            onClick={handlePrint}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Print Report</span>
          </button>

          <button
            id="download-report-pdf-btn"
            onClick={handleDownloadPDF}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            id="export-report-csv-btn"
            onClick={handleDownloadCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'books', name: 'Book Inventory', icon: BookOpen, desc: 'Complete catalog registry' },
          { id: 'available_books', name: 'Available Books', icon: CheckCircle2, desc: 'Books currently on shelf' },
          { id: 'members', name: 'Patron Directory', icon: Users, desc: 'All registered members' },
          { id: 'active_loans', name: 'Active Loans', icon: ArrowRightLeft, desc: 'Books currently issued' },
          { id: 'issue_history', name: 'Issue/Return Log', icon: Calendar, desc: 'Historical audit trail' },
          { id: 'overdue', name: 'Overdue Register', icon: AlertOctagon, desc: 'Late returns & fines' },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = reportType === item.id;
          return (
            <button
              id={`report-select-${item.id}`}
              key={item.id}
              onClick={() => setReportType(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-md ring-2 ring-amber-500/50'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
              <div>
                <p className="font-bold text-xs leading-tight">{item.name}</p>
                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards */}
      {summaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryMetrics.map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">{m.label}</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Report Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Period Scope:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {[
                { id: 'all', label: 'All Records' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDateFilterMode(t.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    dateFilterMode === t.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {reportType === 'books' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ISSUED">Issued</option>
                <option value="DAMAGED">Damaged / Lost</option>
              </select>
            </div>
          )}

          {reportType === 'members' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="ALL">All Members</option>
                <option value="ACTIVE">Active Patrons</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            {previewData.length} records generated
          </span>
          <button
            onClick={fetchReportPreview}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Refresh Dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Preview Table */}
      <div id="printable-report" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Printable Header only visible on print */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 text-center">
          <h2 className="text-lg font-bold">GOVERNMENT LIBRARY - DIGITAL LIBRARY MANAGEMENT SYSTEM</h2>
          <h3 className="text-sm font-bold uppercase tracking-wider mt-1">{getReportTitle()}</h3>
          <p className="text-xs text-slate-500 mt-1">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">Generating tabular dataset...</p>
            </div>
          ) : previewData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No records found matching current report parameters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  {(reportType === 'books' || reportType === 'available_books' || reportType === 'issued_books') && (
                    <>
                      <th className="py-3 px-4">Book No</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Language</th>
                      <th className="py-3 px-4">Shelf</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}
                  {(reportType === 'members' || reportType === 'new_members') && (
                    <>
                      <th className="py-3 px-4">Reg No</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Father / Guardian</th>
                      <th className="py-3 px-4">Village</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Reg Date</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}
                  {(reportType === 'active_loans' || reportType === 'issue_history') && (
                    <>
                      <th className="py-3 px-4">Book Title & No</th>
                      <th className="py-3 px-4">Member Name & Reg No</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Return Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Fine</th>
                    </>
                  )}
                  {reportType === 'overdue' && (
                    <>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Days Overdue</th>
                      <th className="py-3 px-4">Fine (₹)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {previewData.map((row: any, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    {(reportType === 'books' || reportType === 'available_books' || reportType === 'issued_books') && (
                      <>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{row.book_number}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{row.title || row.book_name}</td>
                        <td className="py-2.5 px-4">{row.author}</td>
                        <td className="py-2.5 px-4">{row.category_name || row.category_id || '-'}</td>
                        <td className="py-2.5 px-4">{row.language}</td>
                        <td className="py-2.5 px-4 font-mono">{row.shelf_location || '-'}</td>
                        <td className="py-2.5 px-4">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            row.status === 'AVAILABLE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                    {(reportType === 'members' || reportType === 'new_members') && (
                      <>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-800 dark:text-amber-400">{row.registration_number}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{row.student_name}</td>
                        <td className="py-2.5 px-4">{row.father_name || '-'}</td>
                        <td className="py-2.5 px-4">{row.village}</td>
                        <td className="py-2.5 px-4 font-mono">{row.mobile}</td>
                        <td className="py-2.5 px-4">{new Date(row.registration_date).toLocaleDateString('en-IN')}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                    {(reportType === 'active_loans' || reportType === 'issue_history') && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          {row.book_title || row.book_name} <span className="text-slate-400 font-mono text-[11px]">({row.book_number})</span>
                        </td>
                        <td className="py-2.5 px-4">
                          {row.member_name || row.student_name} <span className="text-amber-800 dark:text-amber-400 font-mono text-[11px]">({row.registration_number || row.member_reg_number})</span>
                        </td>
                        <td className="py-2.5 px-4">{row.issue_date}</td>
                        <td className="py-2.5 px-4 font-semibold">{row.due_date || row.expected_return_date}</td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{row.return_date || row.actual_return_date || '-'}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono">{row.fine_amount ? `₹${row.fine_amount}` : '₹0'}</td>
                      </>
                    )}
                    {reportType === 'overdue' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{row.student_name || row.member_name} ({row.registration_number || row.member_reg_number})</td>
                        <td className="py-2.5 px-4 font-mono">{row.member_mobile || row.mobile}</td>
                        <td className="py-2.5 px-4 font-semibold">{row.book_title || row.book_name} ({row.book_number})</td>
                        <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-bold">{row.due_date || row.expected_return_date}</td>
                        <td className="py-2.5 px-4 font-bold text-rose-700 dark:text-rose-400">{row.days_overdue} Days</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">₹{row.fine_amount}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
