import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit2,
  Key,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'LIBRARIAN';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export const UsersView: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add user modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'LIBRARIAN'>('LIBRARIAN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'LIBRARIAN'>('LIBRARIAN');
  const [editActive, setEditActive] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data || []);
      } else {
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Access Restricted', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newEmail || !newPassword) {
      showToast('error', 'Missing Information', 'All user registration fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      showToast('success', 'Staff Account Created', `Librarian account for ${newName} initialized.`);
      setAddModalOpen(false);
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Creation Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (targetUser: AppUser) => {
    setEditingUser(targetUser);
    setEditName(targetUser.name);
    setEditEmail(targetUser.email);
    setEditRole(targetUser.role);
    setEditActive(targetUser.is_active);
    setEditPassword('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          is_active: editActive,
          password: editPassword.trim() ? editPassword.trim() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      showToast('success', 'Account Updated', `User permissions and profile for ${editName} updated.`);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Update Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Staff & Librarian Accounts Administration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage government library staff accounts, role-based permissions (Admin vs Librarian), and login credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff / Librarian</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading staff credentials...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-base">No Users Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Username & Email</th>
                  <th className="py-3.5 px-4">Role & Privileges</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono font-medium text-slate-900 dark:text-white">@{u.username}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {u.email}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full border text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === 'ADMIN' ? 'Chief Librarian (Admin)' : 'Staff Librarian'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          u.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Staff / Librarian Account</h2>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Officer / Staff Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. ramesh_lib"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Government Official Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. ramesh@karnataka.gov.in"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="LIBRARIAN">Staff Librarian (Cataloging & Circulation)</option>
                  <option value="ADMIN">Chief Librarian / Administrator (Full System Control)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Manage Staff Account</h2>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reset Password (leave empty to keep current)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password to reset"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="LIBRARIAN">Staff Librarian</option>
                  <option value="ADMIN">Chief Librarian (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Active Status</label>
                <select
                  value={editActive ? 'active' : 'suspended'}
                  onChange={(e) => setEditActive(e.target.value === 'active')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="active">Active (Permitted to Log In)</option>
                  <option value="suspended">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
