import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  ScanLine,
  FileEdit,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Hash,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Member, ExtractedMemberData } from '../../types';
import { OCRScannerComponent } from '../ocr/OCRScannerComponent';

interface MemberFormProps {
  memberId?: string; // If editing
  initialData?: ExtractedMemberData; // If coming from OCR scanner
  onNavigate: (route: string, id?: string) => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  memberId,
  initialData,
  onNavigate
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(memberId);

  // Tabs: 'manual' vs 'ocr'
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>(initialData ? 'manual' : 'manual');

  // Form Fields
  const [studentName, setStudentName] = useState(initialData?.student_name || '');
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registration_number || '');
  const [village, setVillage] = useState(initialData?.village || '');
  const [pincode, setPincode] = useState(initialData?.pincode || '');
  const [mobile, setMobile] = useState(initialData?.mobile || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(isEditing);

  // Fetch next registration number if creating a new member
  const fetchNextRegNumber = async () => {
    try {
      const res = await fetch('/api/members/next-number');
      const data = await res.json();
      if (data.next_number) {
        setRegistrationNumber(data.next_number);
        showToast('info', 'Auto Assigned', `Next registration number assigned: ${data.next_number}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If editing, load existing member data
  useEffect(() => {
    if (memberId) {
      setIsFetchingInitial(true);
      fetch(`/api/members/${memberId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setStudentName(data.student_name);
            setRegistrationNumber(data.registration_number);
            setVillage(data.village);
            setPincode(data.pincode || '');
            setMobile(data.mobile);
            setEmail(data.email || '');
            setStatus(data.status || 'ACTIVE');
            setNotes(data.notes || '');
          }
        })
        .catch(err => {
          showToast('error', 'Error', 'Failed to load member profile');
        })
        .finally(() => setIsFetchingInitial(false));
    } else if (!initialData && !registrationNumber) {
      fetchNextRegNumber();
    }
  }, [memberId]);

  // Handle OCR scan completion
  const handleOcrPopulate = (extracted: ExtractedMemberData) => {
    if (extracted.student_name) setStudentName(extracted.student_name);
    if (extracted.registration_number) setRegistrationNumber(extracted.registration_number);
    if (extracted.village) setVillage(extracted.village);
    if (extracted.pincode) setPincode(extracted.pincode);
    if (extracted.mobile) setMobile(extracted.mobile);
    if (extracted.email) setEmail(extracted.email);

    setActiveTab('manual');
    showToast('success', 'Fields Populated', 'OCR data successfully placed in registration form for verification.');
  };

  const handleClear = () => {
    setStudentName('');
    setVillage('');
    setPincode('');
    setMobile('');
    setEmail('');
    setNotes('');
    if (!isEditing) fetchNextRegNumber();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (!studentName.trim()) {
      showToast('error', 'Validation Error', 'Student / Patron name is required.');
      return;
    }
    if (!registrationNumber.trim()) {
      showToast('error', 'Validation Error', 'Registration number is required.');
      return;
    }
    if (!village.trim()) {
      showToast('error', 'Validation Error', 'Village / Town name is required.');
      return;
    }
    if (!mobile.trim() || !/^\d{10}$/.test(mobile.trim())) {
      showToast('error', 'Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (pincode && !/^\d{6}$/.test(pincode.trim())) {
      showToast('error', 'Validation Error', 'Pincode must be exactly 6 digits.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('error', 'Validation Error', 'Please enter a valid email address format.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        student_name: studentName.trim(),
        registration_number: registrationNumber.trim(),
        village: village.trim(),
        pincode: pincode.trim() || '591307',
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        status,
        notes: notes.trim() || undefined
      };

      const url = isEditing ? `/api/members/${memberId}` : '/api/members';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save member profile');
      }

      showToast(
        'success',
        isEditing ? 'Member Updated' : 'Member Registered',
        `Member record for ${studentName} (${registrationNumber}) has been stored.`
      );

      onNavigate('members/detail', data.id || memberId);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingInitial) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
        <span className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></span>
        <p className="font-semibold text-slate-700">Loading member registration details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('members')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Members Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Mode:</span>
          <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-300">
            {isEditing ? 'Editing Record' : 'New Registration'}
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Method Selector Tabs */}
        {!isEditing && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Member Registration Entry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose between physical card OCR scanning or direct manual data entry.
              </p>
            </div>

            <div className="flex rounded-xl border border-slate-300 p-1 bg-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'ocr'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan with OCR</span>
                <Sparkles className="w-3 h-3 text-amber-900" />
              </button>
            </div>
          </div>
        )}

        {/* OCR TAB */}
        {activeTab === 'ocr' && !isEditing && (
          <div className="p-6">
            <OCRScannerComponent
              initialMode="MEMBER"
              onUseForMember={handleOcrPopulate}
            />
          </div>
        )}

        {/* MANUAL FORM TAB */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Student / Patron Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter full legal name (e.g. Ramesh Patil / ರಮೇಶ್ ಪಾಟೀಲ್)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={fetchNextRegNumber}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                    >
                      Auto-Generate Next
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="LIB-2026-00001"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Village / Town */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Village / Town Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Gokak / Konnur / Ghataprabha"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Mobile Phone Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Postal Pincode (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="591307"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Membership Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to borrow)</option>
                  <option value="INACTIVE">INACTIVE (Temporarily restricted)</option>
                  <option value="SUSPENDED">SUSPENDED (Overdue hold)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Additional Notes / Government ID Reference
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Aadhaar verified, Student of Govt First Grade College..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('members')}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <UserPlus className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Register Member'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
