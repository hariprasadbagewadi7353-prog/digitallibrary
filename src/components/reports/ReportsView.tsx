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
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<string>('books');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReportPreview = async () => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (reportType === 'books') {
        endpoint = `/api/books?limit=100&status=${statusFilter}`;
      } else if (reportType === 'members') {
        endpoint = `/api/members?limit=100&status=${statusFilter}`;
      } else if (reportType === 'active_loans') {
        endpoint = `/api/transactions?limit=100&status=ISSUED`;
      } else if (reportType === 'issue_history') {
        endpoint = `/api/transactions?limit=100&from_date=${fromDate}&to_date=${toDate}`;
      } else if (reportType === 'overdue') {
        endpoint = `/api/overdue`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (reportType === 'books') setPreviewData(data.books || []);
      else if (reportType === 'members') setPreviewData(data.members || []);
      else if (reportType === 'active_loans' || reportType === 'issue_history') setPreviewData(data.transactions || []);
      else if (reportType === 'overdue') setPreviewData(data.records || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Report Error', 'Failed to generate report preview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportPreview();
  }, [reportType, statusFilter, fromDate, toDate]);

  const handleDownloadCSV = () => {
    const params = new URLSearchParams({
      type: reportType,
      from_date: fromDate,
      to_date: toDate
    });
    window.location.href = `/api/reports/export-csv?${params.toString()}`;
    showToast('info', 'Export Started', `Downloading ${reportType.toUpperCase()} spreadsheet.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Official Reports & Statistical Exports
              </h1>
              <p className="text-xs text-slate-500">
                Generate government audit registries, member ledgers, catalog inventories, and overdue recovery sheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-300 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: 'books', name: 'Book Inventory', icon: BookOpen, desc: 'Complete catalog registry' },
          { id: 'members', name: 'Patron Directory', icon: Users, desc: 'All registered members' },
          { id: 'active_loans', name: 'Active Loans', icon: ArrowRightLeft, desc: 'Books currently issued' },
          { id: 'issue_history', name: 'Issue/Return Log', icon: Calendar, desc: 'Historical audit trail' },
          { id: 'overdue', name: 'Overdue Fines', icon: AlertOctagon, desc: 'Late returns & fines' },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = reportType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setReportType(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/50'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
              <div>
                <p className="font-bold text-xs leading-tight">{item.name}</p>
                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Report Filters:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              {reportType === 'books' && (
                <>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="ISSUED">Issued Only</option>
                  <option value="DAMAGED">Damaged Only</option>
                </>
              )}
              {reportType === 'members' && (
                <>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </>
              )}
            </select>
          </div>

          {(reportType === 'issue_history' || reportType === 'active_loans') && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">
            {previewData.length} records generated
          </span>
          <button
            onClick={fetchReportPreview}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Preview Table */}
      <div id="printable-report" className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Printable Header only visible on print */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 text-center">
          <h2 className="text-lg font-bold">GOVERNMENT OF KARNATAKA - DEPARTMENT OF PUBLIC LIBRARIES</h2>
          <h3 className="text-sm font-bold uppercase tracking-wider mt-1">Official Registry Report: {reportType.replace('_', ' ')}</h3>
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
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  {reportType === 'books' && (
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
                  {reportType === 'members' && (
                    <>
                      <th className="py-3 px-4">Reg No</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Father / Guardian</th>
                      <th className="py-3 px-4">Village</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Category</th>
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {previewData.map((row: any, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80">
                    {reportType === 'books' && (
                      <>
                        <td className="py-2.5 px-4 font-mono font-bold">{row.book_number}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{row.title}</td>
                        <td className="py-2.5 px-4">{row.author}</td>
                        <td className="py-2.5 px-4">{row.category_name || '-'}</td>
                        <td className="py-2.5 px-4">{row.language}</td>
                        <td className="py-2.5 px-4 font-mono">{row.shelf_location || '-'}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-[10px] uppercase">{row.status}</span>
                        </td>
                      </>
                    )}
                    {reportType === 'members' && (
                      <>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-800">{row.registration_number}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{row.student_name}</td>
                        <td className="py-2.5 px-4">{row.father_name || '-'}</td>
                        <td className="py-2.5 px-4">{row.village}</td>
                        <td className="py-2.5 px-4 font-mono">{row.mobile}</td>
                        <td className="py-2.5 px-4">{row.caste_category || '-'}</td>
                        <td className="py-2.5 px-4 font-bold text-[10px]">{row.status}</td>
                      </>
                    )}
                    {(reportType === 'active_loans' || reportType === 'issue_history') && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {row.book_title} <span className="text-slate-400 font-mono text-[11px]">({row.book_number})</span>
                        </td>
                        <td className="py-2.5 px-4">
                          {row.member_name} <span className="text-amber-800 font-mono text-[11px]">({row.member_reg_number})</span>
                        </td>
                        <td className="py-2.5 px-4">{row.issue_date}</td>
                        <td className="py-2.5 px-4 font-semibold">{row.due_date}</td>
                        <td className="py-2.5 px-4 text-slate-500">{row.return_date || '-'}</td>
                        <td className="py-2.5 px-4 font-bold text-[10px]">{row.status}</td>
                        <td className="py-2.5 px-4 font-mono">{row.fine_amount ? `₹${row.fine_amount}` : '₹0'}</td>
                      </>
                    )}
                    {reportType === 'overdue' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{row.member_name} ({row.member_reg_number})</td>
                        <td className="py-2.5 px-4 font-mono">{row.member_mobile}</td>
                        <td className="py-2.5 px-4 font-semibold">{row.book_title} ({row.book_number})</td>
                        <td className="py-2.5 px-4 text-rose-600 font-bold">{row.due_date}</td>
                        <td className="py-2.5 px-4 font-bold text-rose-700">{row.days_overdue} Days</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-rose-700">₹{row.fine_amount}</td>
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
