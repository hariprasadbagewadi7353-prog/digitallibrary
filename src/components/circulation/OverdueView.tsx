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
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

  const totalFineSum = records.reduce((acc, r) => acc + r.fine_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Overdue Loans & Fine Recovery Desk
              </h1>
              <p className="text-xs text-slate-500">
                Active loans exceeding the 14-day borrowing threshold with automatic fine calculation (₹2/day).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Total Overdue Records</span>
            <span className="text-lg font-bold text-rose-900">{records.length} Books</span>
          </div>

          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Accumulated Fines</span>
            <span className="text-lg font-bold text-amber-900">₹{totalFineSum}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search overdue list by Patron Name, Reg No, or Book Title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <button
          onClick={fetchOverdue}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overdue Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Auditing overdue transactions...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-90" />
            <p className="font-bold text-slate-700 text-base">No Overdue Books Found!</p>
            <p className="mt-1">All currently borrowed books are within the permitted loan period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/50 border-b border-rose-100 text-[11px] font-bold text-slate-700 uppercase">
                  <th className="py-3.5 px-4">Patron / Student</th>
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Days Overdue</th>
                  <th className="py-3.5 px-4">Fine Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => (
                  <tr key={r.transaction_id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.member_name}</p>
                      <p className="font-mono text-[11px] text-amber-800">{r.member_reg_number}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" /> {r.member_mobile} • {r.member_village}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{r.book_title}</p>
                      <p className="font-mono text-[11px] text-slate-500">{r.book_number}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.issue_date}</td>
                    <td className="py-3 px-4 font-bold text-rose-700">{r.due_date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-300 text-[10px]">
                        {r.days_overdue} Days Late
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700 text-sm">
                      ₹{r.fine_amount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintSlip(r)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                          title="Print Notice Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleReturn(r.transaction_id, r.book_title)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1"
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
