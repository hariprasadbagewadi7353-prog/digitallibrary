import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  AlertOctagon,
  CheckCircle2,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Printer,
  Download,
  Building2,
  FileText,
  FileCheck
} from 'lucide-react';
import { Member, Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { generateMemberProfilePDF } from '../../utils/pdfGenerator';
import { exportToCSV } from '../../utils/exportUtils';

interface MemberDetailProps {
  memberId: string;
  onNavigate: (route: string, id?: string) => void;
}

export const MemberDetail: React.FC<MemberDetailProps> = ({ memberId, onNavigate }) => {
  const { showToast } = useToast();
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Return Book modal/action
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMemberData = async () => {
    setIsLoading(true);
    try {
      const [resMember, resTx] = await Promise.all([
        fetch(`/api/members/${memberId}`),
        fetch(`/api/transactions?member_id=${memberId}&limit=100`)
      ]);

      const memberData = await resMember.json();
      const txData = await resTx.json();

      if (resMember.ok) {
        setMember(memberData);
      } else {
        throw new Error(memberData.error || 'Member not found');
      }

      setTransactions(txData.transactions || []);
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const handleReturnBook = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/return/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'Returned via member detail portal' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }
      showToast('success', 'Book Returned', `Book returned successfully. Fine: ₹${data.fine_amount || 0}`);
      fetchMemberData();
    } catch (err: any) {
      showToast('error', 'Return Error', err.message);
    }
  };

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }
      showToast('success', 'Member Deactivated', 'Member profile deactivated from active register.');
      onNavigate('members');
    } catch (err: any) {
      showToast('error', 'Deletion Error', err.message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!member) return;
    try {
      const active = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
      const hist = transactions.filter(t => t.status === 'RETURNED');
      generateMemberProfilePDF(member, active, hist);
      showToast('success', 'PDF Generated', `Member record for ${member.student_name} generated.`);
    } catch (err: any) {
      showToast('error', 'PDF Error', err.message || 'Failed to generate PDF document.');
    }
  };

  const handleExportCSV = () => {
    if (!member) return;
    exportToCSV(
      transactions,
      `Borrowing_History_${member.registration_number}`,
      [
        { key: 'book_number', label: 'Book Number' },
        { key: 'book_title', label: 'Book Title' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'return_date', label: 'Return Date' },
        { key: 'status', label: 'Loan Status' },
        { key: 'fine_amount', label: 'Fine Amount (INR)' },
        { key: 'remarks', label: 'Remarks' }
      ]
    );
    showToast('info', 'Export Complete', 'Member borrowing history exported to CSV.');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-200">Loading Member Profile & Circulation History...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-300 font-bold">Member record not found.</p>
        <button
          onClick={() => onNavigate('members')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
        >
          Return to Members Directory
        </button>
      </div>
    );
  }

  const activeLoans = transactions.filter(t => t.status === 'ISSUED' || t.status === 'OVERDUE');
  const returnedLoans = transactions.filter(t => t.status === 'RETURNED');
  const overdueLoans = transactions.filter(t => t.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          id="member-detail-back-btn"
          type="button"
          onClick={() => onNavigate('members')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="print-member-record-btn"
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Member Record</span>
          </button>

          <button
            id="download-member-pdf-btn"
            onClick={handleDownloadPDF}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Member PDF</span>
          </button>

          <button
            id="export-member-history-csv"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="member-detail-issue-btn"
            onClick={() => onNavigate('issue-book')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Book</span>
          </button>

          <button
            id="member-detail-edit-btn"
            onClick={() => onNavigate('members/edit', member.id)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            id="member-detail-delete-btn"
            onClick={() => setDeleteModalOpen(true)}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 font-bold px-3 py-2 rounded-xl text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
            title="Deactivate / Delete Member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper */}
      <div id="printable-member-dossier" className="space-y-6">
        {/* Printable Official Government Letterhead (Appears only on Print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-center">
          <h2 className="text-xl font-extrabold uppercase tracking-tight">Government Library</h2>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Digital Member Record & Circulation Dossier</h3>
          <p className="text-xs text-slate-600 mt-1">Department of Public Libraries • Official Public Information Record</p>
          <p className="text-[11px] text-slate-500">Date Generated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* Member Profile Overview Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 text-2xl font-bold">
                {member.student_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {member.student_name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : member.status === 'SUSPENDED'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {member.status}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 mt-1">
                  Accession / Reg No: {member.registration_number}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">Total Issued</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{transactions.length}</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Currently Held</span>
                <span className="text-lg font-bold text-amber-800 dark:text-amber-300">{activeLoans.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Returned</span>
                <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{returnedLoans.length}</span>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Overdue</span>
                <span className="text-lg font-bold text-rose-800 dark:text-rose-300">{overdueLoans.length}</span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Village / Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{member.village} {member.pincode ? `(PIN: ${member.pincode})` : ''}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Mobile Contact</span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{member.mobile}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{member.email || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Registration Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(member.registration_date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>

          {member.father_name && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300">Father / Guardian Name: </span>
              {member.father_name}
            </div>
          )}

          {member.notes && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300">Official Notes: </span>
              {member.notes}
            </div>
          )}
        </div>

        {/* Currently Issued Books Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                CURRENTLY ISSUED BOOKS ({activeLoans.length})
              </h2>
            </div>
            {activeLoans.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Max allowance: 3 books per member
              </span>
            )}
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No books currently on loan.</p>
              <p className="mt-0.5">Member is eligible to borrow up to 3 library books.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">Book Number</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Expected Return Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {activeLoans.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{tx.book_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{tx.book_title}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tx.issue_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <span className={tx.status === 'OVERDUE' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {tx.due_date || tx.expected_return_date}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'OVERDUE'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right print:hidden">
                        <button
                          onClick={() => handleReturnBook(tx.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          Receive Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Complete Borrowing History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              BORROWING HISTORY ({returnedLoans.length})
            </h2>
          </div>

          {returnedLoans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>No previous returned transaction history recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">Book Number</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Fine (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {returnedLoans.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{tx.book_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{tx.book_title}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.issue_date}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{tx.return_date || tx.actual_return_date || '-'}</td>
                      <td className="py-3 px-4 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">{tx.status}</td>
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

        {/* Member Statistics Footer Summary for Print */}
        <div className="hidden print:flex justify-between items-center pt-8 border-t border-slate-300 text-xs text-slate-600">
          <div>
            <p className="font-bold">Authorized Signatory & Seal</p>
            <p className="text-[10px] text-slate-500 mt-8">Chief Librarian / Registrar</p>
          </div>
          <div className="text-right">
            <p>Government Library System</p>
            <p className="text-[10px]">Official Computer Generated Dossier</p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Member Deactivation"
        message={`Are you sure you want to deactivate ${member.student_name}? Their past borrowing history will remain preserved in audit records.`}
        confirmText="Deactivate Member"
        onConfirm={handleDeleteMember}
        onClose={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
