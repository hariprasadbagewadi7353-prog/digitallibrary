import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ScanLine,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Member } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { exportToCSV } from '../../utils/exportUtils';

interface MemberListProps {
  onNavigate: (route: string, id?: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        village: villageFilter,
        page: String(page),
        limit: '10'
      });
      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      setMembers(data.members || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'Failed to load member records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter, villageFilter, page]);

  const handleExportCSV = () => {
    if (members.length === 0) {
      showToast('warning', 'No Records', 'No members available to export.');
      return;
    }
    exportToCSV(
      members,
      `government_library_members_${new Date().toISOString().slice(0, 10)}`,
      [
        { key: 'registration_number', label: 'Registration Number' },
        { key: 'student_name', label: 'Student / Patron Name' },
        { key: 'father_name', label: 'Father / Guardian Name' },
        { key: 'village', label: 'Village / Town' },
        { key: 'pincode', label: 'Pincode' },
        { key: 'mobile', label: 'Mobile Number' },
        { key: 'email', label: 'Email' },
        { key: 'registration_date', label: 'Registration Date' },
        { key: 'status', label: 'Membership Status' }
      ]
    );
    showToast('info', 'Export Started', 'Members registry spreadsheet exported.');
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }
      showToast('success', 'Member Removed', `Member ${memberToDelete.student_name} (${memberToDelete.registration_number}) was deactivated.`);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err: any) {
      showToast('error', 'Cannot Delete Member', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Library Members Directory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage student & patron records, registration cards, and membership status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="export-members-csv-btn"
            onClick={handleExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            id="members-scan-btn"
            onClick={() => onNavigate('members/scan')}
            className="bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs border border-amber-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan with OCR</span>
          </button>

          <button
            id="add-member-btn"
            onClick={() => onNavigate('members/add')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member Manually</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="member-search-input"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by student name, registration no (LIB-2026-...), village, mobile, or pincode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            id="member-status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={fetchMembers}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Showing {members.length} of {totalCount} registered members
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Page {page} of {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Student / Patron Name</th>
                <th className="py-3 px-4">Village / Town</th>
                <th className="py-3 px-4">Mobile Contact</th>
                <th className="py-3 px-4">Pincode</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span>Loading library member database...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No members matched your search criteria.</p>
                    <p className="text-xs mt-1">Try clearing filters or add a new student registration record.</p>
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                        {member.registration_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <button
                        onClick={() => onNavigate('members/detail', member.id)}
                        className="hover:text-amber-600 dark:hover:text-amber-400 text-left transition-colors cursor-pointer"
                      >
                        {member.student_name}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {member.village}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {member.mobile}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {member.pincode || '591307'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(member.registration_date).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('members/detail', member.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                          title="View Full Profile & Borrowing History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onNavigate('members/edit', member.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit Member Information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setMemberToDelete(member);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Member Deactivation"
        message={`Are you sure you want to deactivate member '${memberToDelete?.student_name}' (${memberToDelete?.registration_number})? Members with unreturned borrowed books cannot be deleted.`}
        confirmText="Yes, Deactivate Member"
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
};
