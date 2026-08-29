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
  RefreshCw
} from 'lucide-react';
import { Member, Transaction } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

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
  const [returningTxId, setReturningTxId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMemberData = async () => {
    setIsLoading(true);
    try {
      const [resMember, resTx] = await Promise.all([
        fetch(`/api/members/${memberId}`),
        fetch(`/api/transactions?member_id=${memberId}&limit=50`)
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
      showToast('success', 'Member Deleted', 'Member profile removed.');
      onNavigate('members');
    } catch (err: any) {
      showToast('error', 'Deletion Error', err.message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Loading Member Profile & Circulation History...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <p className="text-slate-600 font-bold">Member record not found.</p>
        <button
          onClick={() => onNavigate('members')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('members')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('issue-book')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue New Book</span>
          </button>

          <button
            onClick={() => onNavigate('members/edit', member.id)}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-rose-200 transition-colors"
            title="Delete Member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Member Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 text-2xl font-bold">
              {member.student_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {member.student_name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : member.status === 'SUSPENDED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {member.status}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-amber-700 mt-1">
                Accession / Reg No: {member.registration_number}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Issued</span>
              <span className="text-lg font-bold text-slate-800">{transactions.length}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Currently Held</span>
              <span className="text-lg font-bold text-amber-800">{activeLoans.length}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Overdue</span>
              <span className="text-lg font-bold text-rose-800">{overdueLoans.length}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Village / Town</span>
              <span className="font-semibold text-slate-800">{member.village} (PIN: {member.pincode})</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Contact</span>
              <span className="font-semibold font-mono text-slate-800">{member.mobile}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-semibold text-slate-800">{member.email || 'Not provided'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Since</span>
              <span className="font-semibold text-slate-800">{member.registration_date}</span>
            </div>
          </div>
        </div>

        {member.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Official Notes: </span>
            {member.notes}
          </div>
        )}
      </div>

      {/* Currently Issued Books Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-base text-slate-900">
              Currently Borrowed Books ({activeLoans.length})
            </h2>
          </div>
          {activeLoans.length > 0 && (
            <span className="text-xs text-slate-500">
              Max loan allowance: 3 books per member
            </span>
          )}
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-600">No books currently on loan.</p>
            <p className="mt-0.5">This member is eligible to borrow up to 3 library books.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Book Number</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.book_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{tx.book_title}</td>
                    <td className="py-3 px-4 text-slate-600">{tx.issue_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className={tx.status === 'OVERDUE' ? 'text-rose-600 font-bold' : ''}>
                        {tx.due_date}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReturnBook(tx.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors"
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
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-base text-slate-900">
            Historical Loan Records ({returnedLoans.length})
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
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Book Number</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4">Returned On</th>
                  <th className="py-3 px-4">Fine Collected</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {returnedLoans.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold">{tx.book_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.book_title}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.issue_date}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.return_date || '-'}</td>
                    <td className="py-3 px-4 font-mono">
                      {tx.fine_amount ? `₹${tx.fine_amount}` : '₹0'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.remarks || 'Standard loan'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Member Deletion"
        message={`Are you sure you want to delete ${member.student_name}? This cannot be undone.`}
        confirmText="Delete Record"
        onConfirm={handleDeleteMember}
        onClose={() => setDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
