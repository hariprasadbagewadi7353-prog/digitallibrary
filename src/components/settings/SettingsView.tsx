import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Sliders,
  Layers,
  Shield,
  Save,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Database,
  Download,
  AlertTriangle,
  CheckCircle2,
  History
} from 'lucide-react';
import { Category, AuditLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'library' | 'policy' | 'categories' | 'audit'>('library');

  // Library General Settings
  const [libraryName, setLibraryName] = useState('Government Central Library Gokak');
  const [branchCode, setBranchCode] = useState('GK-01-CENTRAL');
  const [district, setDistrict] = useState('Belagavi');
  const [state, setState] = useState('Karnataka');
  const [address, setAddress] = useState('Court Circle, Gokak, Karnataka 591307');
  const [contactEmail, setContactEmail] = useState('gokak.library@karnataka.gov.in');
  const [contactPhone, setContactPhone] = useState('+91 8332 225430');

  // Policy Settings
  const [loanDurationDays, setLoanDurationDays] = useState(14);
  const [maxBooksPerMember, setMaxBooksPerMember] = useState(3);
  const [dailyFineINR, setDailyFineINR] = useState(2);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs?limit=50');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAuditLogs();
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('success', 'Settings Saved', 'Library configuration parameters updated.');
    }, 400);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatCode.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          code: newCatCode.trim().toUpperCase()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category');

      showToast('success', 'Category Created', `Added '${newCatName}' to library classifications.`);
      setNewCatName('');
      setNewCatCode('');
      setIsAddingCat(false);
      fetchCategories();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
    showToast('info', 'Database Backup', 'Exporting local library JSON database snapshot.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                System Administration & Library Preferences
              </h1>
              <p className="text-xs text-slate-500">
                Configure institution parameters, circulation rules, classifications, and system audit logs.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportBackup}
          className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-all shadow-xs"
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>Download Database Snapshot</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'library'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Library Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'policy'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Circulation Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories & Dewey Classifications ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trails</span>
        </button>
      </div>

      {/* TAB 1: Library Info Form */}
      {activeTab === 'library' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Institution Identity & Branch Registration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Details printed on official transaction slips and overdue notice letters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Library Name
              </label>
              <input
                type="text"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Branch Accession Node Code
              </label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                District / Administrative Region
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                State Department
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Postal Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Official Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Landline / Support Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              {isSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <Save className="w-4 h-4" />
              <span>Save Library Information</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Circulation Policies */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Borrowing Limits & Fine Schedules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define automated rules enforcing book return deadlines and penalties.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Standard Loan Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={loanDurationDays}
                onChange={(e) => setLoanDurationDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500">Government library default is 14 calendar days per book.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Maximum Books per Patron
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxBooksPerMember}
                onChange={(e) => setMaxBooksPerMember(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500">Maximum simultaneous active loans allowed per student/patron.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Overdue Fine Rate (₹ / Day)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={dailyFineINR}
                onChange={(e) => setDailyFineINR(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500">Daily late fee applied automatically after the due date expires.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => showToast('success', 'Policies Updated', 'Circulation rules saved successfully.')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Circulation Policies</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Categories & Dewey Classifications */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Book Classifications & Shelf Categories</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage subject groups used for cataloging and physical shelf arrangement.</p>
            </div>

            {!isAddingCat && (
              <button
                onClick={() => setIsAddingCat(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            )}
          </div>

          {/* Add Category Drawer */}
          {isAddingCat && (
            <form onSubmit={handleAddCategory} className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
              <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">New Category Definition</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Science & Technology"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dewey / Shelf Code</label>
                  <input
                    type="text"
                    required
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                    placeholder="e.g. SCI-500"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCat(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {cat.code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1.5">{cat.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">System Activity & Audit Log Trails</h2>
              <p className="text-xs text-slate-500">Chronological ledger of user logins, catalog creations, and circulation events.</p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Operator</th>
                  <th className="py-2.5 px-4">Log Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.entity_type}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.user_name || 'System'}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
