'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  LogOut,
  ChevronRight,
  X,
  Send,
  Building2,
  Users,
  RefreshCw,
  User,
  MessageSquare,
  AlertCircle,
  Printer,
  ArrowRightLeft,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/alerts';

interface Unit {
  id: string;
  code: string;
  nameEn: string;
  nameNp: string;
}

interface Department {
  id: string;
  nameEn: string;
  nameNp: string;
  code: string;
  slaHours?: number;
  units?: Unit[];
}

interface ActionLog {
  id: string;
  actionType: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface ComplaintMessage {
  id: string;
  senderType: string;
  senderName: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
}

interface Complaint {
  id: string;
  trackingId: string;
  pin: string;
  isAnonymous: boolean;
  patientName: string | null;
  patientPhone: string | null;
  patientEmail: string | null;
  mrnNumber: string | null;
  category: string;
  departmentId: string;
  department: Department;
  unit?: Unit | null;
  targetPersonName: string | null;
  targetPersonRole: string | null;
  incidentDate: string;
  location: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  actionSummary: string | null;
  resolvedAt: string | null;
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  actions: ActionLog[];
  feedback?: { rating: number; comments: string | null } | null;
  slaDeadline?: string;
  isOverdue?: boolean;
  hoursOverdue?: number;
  hoursRemaining?: number;
  messages?: ComplaintMessage[];
  capa?: CapaRecord | null;
  _count?: {
    messages: number;
    actions: number;
  };
}

interface CapaRecord {
  id: string;
  rootCauseCategory: string;
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventiveAction: string;
  status: string;
  targetReviewDate?: string | null;
  qaOfficerName?: string | null;
  qaNotes?: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'GRIEVANCE_ADMIN' | 'DEPT_HEAD' | 'INVESTIGATOR';
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
}

interface StaffStats {
  total: number;
  pendingInquiry: number;
  submitted: number;
  underInvestigation: number;
  actionTaken: number;
  resolved: number;
  assignedToMe: number;
  overdueCount: number;
}

export default function StaffDashboardPage() {
  const router = useRouter();

  // Authentication & Profile
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeDept, setActiveDept] = useState<Department | null>(null);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING_INQUIRY' | 'ASSIGNED_TO_ME' | 'OVERDUE' | 'RESOLVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Active Complaint Investigation Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [modalTab, setModalTab] = useState<'INQUIRY' | 'MESSAGES' | 'CAPA'>('INQUIRY');

  // Investigation Form State
  const [modalStatus, setModalStatus] = useState('');
  const [modalActionSummary, setModalActionSummary] = useState('');
  const [modalStatementNote, setModalStatementNote] = useState('');
  const [modalIsPublicNote, setModalIsPublicNote] = useState(false);
  const [transferTargetDeptId, setTransferTargetDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Two-Way Messaging State
  const [complaintMessages, setComplaintMessages] = useState<ComplaintMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [staffMessageText, setStaffMessageText] = useState('');
  const [sendingStaffMessage, setSendingStaffMessage] = useState(false);

  // CAPA State
  const [capaRootCauseCategory, setCapaRootCauseCategory] = useState('PROCESS_DEFECT');
  const [capaRootCauseAnalysis, setCapaRootCauseAnalysis] = useState('');
  const [capaCorrectiveAction, setCapaCorrectiveAction] = useState('');
  const [capaPreventiveAction, setCapaPreventiveAction] = useState('');
  const [capaStatus, setCapaStatus] = useState('PENDING_QA_REVIEW');
  const [capaTargetReviewDate, setCapaTargetReviewDate] = useState('');
  const [capaOfficerName, setCapaOfficerName] = useState('');
  const [capaNotes, setCapaNotes] = useState('');
  const [savingCapa, setSavingCapa] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (modalTab === 'MESSAGES') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [complaintMessages, modalTab]);

  // Load Workspace Data
  const loadWorkspace = async (deptId?: string) => {
    setLoading(true);
    try {
      let url = '/api/staff/complaints?';
      if (statusTab === 'PENDING_INQUIRY') {
        url += 'status=PENDING_INQUIRY&';
      } else if (statusTab === 'ASSIGNED_TO_ME') {
        url += 'assigned=ME&';
      } else if (statusTab === 'OVERDUE') {
        url += 'sla=OVERDUE&';
      } else if (statusTab === 'RESOLVED') {
        url += 'status=RESOLVED&';
      }

      if (categoryFilter !== 'ALL') url += `category=${categoryFilter}&`;
      if (priorityFilter !== 'ALL') url += `priority=${priorityFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (deptId || selectedDeptId) url += `departmentId=${deptId || selectedDeptId}&`;

      const res = await fetch(url);
      if (res.status === 401) {
        showWarningAlert('Session Expired', 'Please sign in to access the department officer workspace.');
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.currentUser);
        setActiveDept(data.department);
        setAllDepartments(data.allDepartments || []);
        setStats(data.stats);
        setComplaints(data.complaints || []);
      } else {
        showErrorAlert('Failed to Load Workspace', data.message);
      }
    } catch (err: any) {
      console.error('Error loading staff dashboard:', err);
      showErrorAlert('Connection Error', 'Could not connect to the hospital server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [statusTab, categoryFilter, priorityFilter, selectedDeptId]);

  // Handle Search on Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkspace();
  };

  // Open Investigation Modal
  const openInvestigationModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setModalStatus(c.status);
    setModalActionSummary(c.actionSummary || '');
    setModalStatementNote('');
    setModalIsPublicNote(false);
    setTransferTargetDeptId('');
    setTransferReason('');
    setModalTab('INQUIRY');
    loadMessagesForComplaint(c.id);
    fetchCapaForComplaint(c.id);
  };

  // Close Investigation Modal
  const closeInvestigationModal = () => {
    setSelectedComplaint(null);
  };

  // Load CAPA record
  const fetchCapaForComplaint = async (complaintId: string) => {
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/capa`);
      const data = await res.json();
      if (data.success && data.capa) {
        setCapaRootCauseCategory(data.capa.rootCauseCategory || 'PROCESS_DEFECT');
        setCapaRootCauseAnalysis(data.capa.rootCauseAnalysis || '');
        setCapaCorrectiveAction(data.capa.correctiveAction || '');
        setCapaPreventiveAction(data.capa.preventiveAction || '');
        setCapaStatus(data.capa.status || 'PENDING_QA_REVIEW');
        setCapaTargetReviewDate(data.capa.targetReviewDate ? data.capa.targetReviewDate.split('T')[0] : '');
        setCapaOfficerName(data.capa.qaOfficerName || '');
        setCapaNotes(data.capa.qaNotes || '');
      } else {
        setCapaRootCauseCategory('PROCESS_DEFECT');
        setCapaRootCauseAnalysis('');
        setCapaCorrectiveAction('');
        setCapaPreventiveAction('');
        setCapaStatus('PENDING_QA_REVIEW');
        setCapaTargetReviewDate('');
        setCapaOfficerName(currentUser?.name || '');
        setCapaNotes('');
      }
    } catch (err) {
      console.error('Error loading CAPA in staff dashboard:', err);
    }
  };

  // Save CAPA record
  const handleSaveCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!capaRootCauseAnalysis.trim() || !capaCorrectiveAction.trim() || !capaPreventiveAction.trim()) {
      showErrorAlert('Missing Required Fields', 'Please complete the Root Cause Analysis, Corrective Action, and Preventive Action fields.');
      return;
    }

    setSavingCapa(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}/capa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCauseCategory: capaRootCauseCategory,
          rootCauseAnalysis: capaRootCauseAnalysis.trim(),
          correctiveAction: capaCorrectiveAction.trim(),
          preventiveAction: capaPreventiveAction.trim(),
          status: capaStatus,
          targetReviewDate: capaTargetReviewDate || null,
          qaOfficerName: capaOfficerName.trim() || currentUser?.name || 'Department Officer',
          qaNotes: capaNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          'CAPA Record Documented & Audited / क्यापा सुरक्षित भयो',
          `Corrective & Preventive Action for grievance ${selectedComplaint.trackingId} recorded successfully.`
        );
        loadWorkspace();
      } else {
        showErrorAlert('Failed to Save CAPA', data.message);
      }
    } catch (err: any) {
      showErrorAlert('Error Saving CAPA', err.message);
    } finally {
      setSavingCapa(false);
    }
  };

  // Load Two-Way Messages
  const loadMessagesForComplaint = async (complaintId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/messages`);
      const data = await res.json();
      if (data.success) {
        setComplaintMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send Two-Way Message from Staff to Patient
  const handleSendStaffMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedComplaint || !staffMessageText.trim()) return;

    setSendingStaffMessage(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: staffMessageText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStaffMessageText('');
        showToast('Message sent to patient via inquiry thread & WhatsApp', 'success');
        await loadMessagesForComplaint(selectedComplaint.id);
      } else {
        showErrorAlert('Failed to Send Message', data.message);
      }
    } catch (err: any) {
      showErrorAlert('Send Error', err.message);
    } finally {
      setSendingStaffMessage(false);
    }
  };

  // Insert Quick Response Template
  const insertQuickTemplate = (text: string) => {
    setStaffMessageText((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Quick Action 1: Acknowledge & Start Inquiry
  const handleQuickAcknowledge = async () => {
    if (!selectedComplaint) return;

    const confirmed = await showConfirmDialog(
      'Acknowledge Grievance / उजुरी स्वीकार गर्नुहोस्',
      `Advance status of ${selectedComplaint.trackingId} to "Under Investigation" by ${activeDept?.nameEn || 'Department'}?`,
      'Yes, Acknowledge Case'
    );

    if (!confirmed) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UNDER_INVESTIGATION',
          note: `Department officer (${currentUser?.name || 'Staff'}) acknowledged the complaint and initiated active inquiry.`,
          isPublicNote: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          'Case Acknowledged / उजुरी स्वीकृत',
          `Grievance ${selectedComplaint.trackingId} is now under active departmental investigation.`
        );
        closeInvestigationModal();
        loadWorkspace();
      } else {
        showErrorAlert('Update Failed', data.message);
      }
    } catch (err: any) {
      showErrorAlert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Save Department Investigation Findings & Actions
  const handleSaveInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    // Check if transferring department
    if (transferTargetDeptId && transferTargetDeptId !== selectedComplaint.departmentId) {
      const targetDept = allDepartments.find((d) => d.id === transferTargetDeptId);
      const confirmed = await showConfirmDialog(
        'Confirm Department Transfer / शाखा स्थानान्तरण',
        `Are you sure you want to transfer grievance ${selectedComplaint.trackingId} to "${targetDept?.nameEn}"? This department will no longer be responsible for this grievance.`,
        'Transfer Department',
        'Cancel',
        true
      );
      if (!confirmed) return;
    }

    setUpdating(true);
    try {
      const body: any = {
        status: modalStatus,
        actionSummary: modalActionSummary.trim() || undefined,
        note: modalStatementNote.trim() || undefined,
        isPublicNote: modalIsPublicNote,
      };

      if (transferTargetDeptId && transferTargetDeptId !== selectedComplaint.departmentId) {
        body.departmentId = transferTargetDeptId;
        body.transferReason = transferReason.trim() || 'Transferred by department officer during inquiry.';
      }

      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          'Inquiry Statement & Actions Saved',
          'Department findings, action logs, and patient notifications have been updated.'
        );
        closeInvestigationModal();
        loadWorkspace();
      } else {
        showErrorAlert('Failed to Update', data.message);
      }
    } catch (err: any) {
      showErrorAlert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Sign Out / बाहिरिनुहोस्',
      'Are you sure you want to end your department officer session?',
      'Yes, Sign Out'
    );
    if (!confirmed) return;

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('Signed out successfully', 'info');
      router.push('/admin/login');
    } catch (err) {
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* 1. TOP HOSPITAL WORKSPACE HEADER */}
      <header className="bg-[#1b3b64] text-white border-b border-blue-950/40 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/bkmch-logo.png"
                alt="BPKMCH Crest"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल
                </h1>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Staff Workspace
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                शाखा तथा विभाग उजुरी कार्यकक्ष • Department Officer Grievance Desk
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="bg-blue-900/60 border border-blue-400/30 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700/80 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-blue-200 mt-0.5">
                    {currentUser.role === 'DEPT_HEAD'
                      ? 'Head of Department'
                      : currentUser.role === 'INVESTIGATOR'
                      ? 'Investigating Officer'
                      : 'Central Administrator'}
                    {activeDept && ` • ${activeDept.nameEn}`}
                  </div>
                </div>
              </div>
            )}

            {/* Switch to Central Admin (if authorized) */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GRIEVANCE_ADMIN') && (
              <Link
                href="/admin/dashboard"
                className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-600/40"
                title="Go to Central Hospital Administration Portal"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Central Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl transition border border-rose-500/30"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. ACTIVE DEPARTMENT IDENTITY SUB-HEADER */}
        <div className="bg-[#152e4d] border-t border-blue-900/60 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-blue-300">Assigned Department:</span>
              <span className="font-extrabold text-white text-sm">
                {activeDept ? activeDept.nameEn : 'Hospital-wide Assignment'}
              </span>
              {activeDept?.code && (
                <span className="px-2 py-0.5 bg-blue-800/80 text-blue-200 font-mono text-[11px] rounded font-semibold border border-blue-600/40">
                  {activeDept.code}
                </span>
              )}
              {activeDept?.slaHours && (
                <span className="text-[11px] text-blue-200 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded text-emerald-300 font-semibold">
                  ⏱️ SLA Target: {activeDept.slaHours} Hours
                </span>
              )}
            </div>

            {/* Department Selector for Admins */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GRIEVANCE_ADMIN') && allDepartments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-blue-300 text-[11px]">Simulate Department:</span>
                <select
                  value={selectedDeptId || (activeDept?.id || '')}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                  }}
                  className="bg-blue-900/80 text-white text-xs px-2.5 py-1 rounded-lg border border-blue-600/50 font-medium focus:ring-1 focus:ring-amber-400"
                >
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.nameEn} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI METRIC CARDS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Cases */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total in Dept
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">सबै सुझाव तथा गुनासोहरू</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* Pending Inquiry */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Under Inquiry
                </p>
                <p className="text-2xl font-black text-amber-700 mt-0.5">{stats.pendingInquiry}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">छानबिन जारी</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Assigned To Me */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Assigned to Me
                </p>
                <p className="text-2xl font-black text-indigo-700 mt-0.5">{stats.assignedToMe}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">मलाई खटिएको</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* SLA Overdue Alert */}
            <div className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center justify-between ${
              stats.overdueCount > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
            }`}>
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  SLA Overdue
                </p>
                <p className="text-2xl font-black text-rose-700 mt-0.5">{stats.overdueCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">म्याद नाघेको</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Resolved / Done
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">{stats.resolved}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">सफलतापूर्वक समाधान</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* 4. WORKSPACE CONTROLS & TAB NAVIGATION */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b lg:border-b-0 pb-3 lg:pb-0 border-slate-200">
              <button
                onClick={() => setStatusTab('ALL')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  statusTab === 'ALL'
                    ? 'bg-[#1b3b64] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All Cases</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-current">
                  {stats?.total || 0}
                </span>
              </button>

              <button
                onClick={() => setStatusTab('PENDING_INQUIRY')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  statusTab === 'PENDING_INQUIRY'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Inquiry</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-current">
                  {stats?.pendingInquiry || 0}
                </span>
              </button>

              <button
                onClick={() => setStatusTab('ASSIGNED_TO_ME')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  statusTab === 'ASSIGNED_TO_ME'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assigned to Me</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-current">
                  {stats?.assignedToMe || 0}
                </span>
              </button>

              <button
                onClick={() => setStatusTab('OVERDUE')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  statusTab === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SLA Overdue</span>
                {stats?.overdueCount ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-rose-600 font-black">
                    {stats.overdueCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setStatusTab('RESOLVED')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  statusTab === 'RESOLVED'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-current">
                  {stats?.resolved || 0}
                </span>
              </button>
            </div>

            {/* Refresh Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadWorkspace()}
                disabled={loading}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Refresh Workspace"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search tracking ID, patient, staff name, room/bed, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64] focus:bg-white"
              />
            </form>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
              >
                <option value="ALL">All Categories / सबै वर्गहरू</option>
                <option value="MEDICAL_CARE">🩺 Medical Care & Treatment</option>
                <option value="STAFF_BEHAVIOR">👥 Staff Behavior & Conduct</option>
                <option value="BILLING">💳 Billing & Financial</option>
                <option value="HYGIENE">🧹 Hygiene & Sanitation</option>
                <option value="FACILITIES">🏢 Infrastructure & Facilities</option>
                <option value="DELAY_IN_SERVICE">⏳ Delay in Service</option>
                <option value="PHARMACY">💊 Pharmacy & Medicine</option>
                <option value="OTHER">📁 Other Grievances</option>
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
              >
                <option value="ALL">All Priorities / प्राथमिकता</option>
                <option value="CRITICAL">🔴 Critical (Immediate Alert)</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="LOW">🔵 Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. GRIEVANCE CASES LISTING */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 border-4 border-[#1b3b64] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading department grievances...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Grievances Found in this View</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No complaints currently match the selected criteria for{' '}
                <strong>{activeDept?.nameEn || 'your department'}</strong>.
              </p>
            </div>
          ) : (
            complaints.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md p-4 sm:p-5 space-y-3 ${
                  c.isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : c.status === 'RESOLVED'
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Row: Tracking ID, Badges, SLA */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#1b3b64] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                      {c.trackingId}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        c.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : c.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : c.priority === 'MEDIUM'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.priority}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'ACTION_TAKEN'
                          ? 'bg-teal-100 text-teal-800'
                          : c.status === 'UNDER_INVESTIGATION'
                          ? 'bg-amber-100 text-amber-800'
                          : c.status === 'ESCALATED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>

                    {/* Sub-Unit Badge if present */}
                    {c.unit && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        Unit: {c.unit.nameEn}
                      </span>
                    )}

                    {/* Assigned to Me Badge */}
                    {currentUser && c.assignedToId === currentUser.id && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                        ★ Assigned to You
                      </span>
                    )}

                    {/* CAPA Status Badge */}
                    {c.capa && (
                      <span className="text-[10px] bg-blue-50 border border-blue-200 text-[#1b3b64] px-2 py-0.5 rounded-full font-bold">
                        🛡️ CAPA: {c.capa.rootCauseCategory.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* SLA Indicator */}
                  <div className="flex items-center gap-2">
                    {c.isOverdue ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>SLA Overdue by {c.hoursOverdue}h</span>
                      </div>
                    ) : c.status !== 'RESOLVED' && c.status !== 'REJECTED' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg border border-blue-200">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                        <span>SLA: {c.hoursRemaining}h remaining</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Resolved</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complaint Subject & Narrative */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{c.subject}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                {/* Meta details: Patient, Location, Staff Involved */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-500 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {c.isAnonymous ? (
                        <span className="font-semibold text-slate-700">Protected Anonymous</span>
                      ) : (
                        <span>
                          <strong>{c.patientName}</strong>{' '}
                          {c.patientPhone && <span className="text-slate-400 font-mono">({c.patientPhone})</span>}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Location: <strong className="text-slate-700">{c.location}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Staff: <strong className="text-slate-700">{c.targetPersonName || 'Not specified'}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reported: {new Date(c.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Dossier Button */}
                    <Link
                      href={`/admin/complaints/${c.trackingId}/dossier`}
                      target="_blank"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                      title="View Official Printable A4 Dossier"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </Link>

                    {/* Manage & Investigate Button */}
                    <button
                      onClick={() => openInvestigationModal(c)}
                      className="px-4 py-1.5 bg-[#1b3b64] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Investigate / छानबिन गर्नुहोस्</span>
                      {c.messages && c.messages.length > 0 && (
                        <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                          💬 {c.messages.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 6. MODAL: DEPARTMENT INVESTIGATION & TWO-WAY DIALOGUE */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#1b3b64] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded">
                    {selectedComplaint.trackingId}
                  </span>
                  <span className="text-xs font-semibold text-blue-200">
                    PIN: <code className="font-mono font-bold text-white">{selectedComplaint.pin}</code>
                  </span>
                  <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                    {selectedComplaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {selectedComplaint.subject}
                </h3>
              </div>

              <button
                onClick={closeInvestigationModal}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 shrink-0">
              <button
                onClick={() => setModalTab('INQUIRY')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === 'INQUIRY'
                    ? 'border-[#1b3b64] text-[#1b3b64]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Department Inquiry & Action</span>
              </button>

              <button
                onClick={() => setModalTab('MESSAGES')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 relative ${
                  modalTab === 'MESSAGES'
                    ? 'border-[#1b3b64] text-[#1b3b64]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Two-Way Patient Dialogue</span>
                {complaintMessages.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {complaintMessages.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setModalTab('CAPA')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 relative ${
                  modalTab === 'CAPA'
                    ? 'border-[#1b3b64] text-[#1b3b64]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Quality & CAPA Audit</span>
                {selectedComplaint.capa && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    Audited
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {modalTab === 'INQUIRY' ? (
                <form onSubmit={handleSaveInvestigation} className="space-y-5">
                  {/* Complaint Snapshot Box */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between text-slate-500">
                      <span>Location: <strong>{selectedComplaint.location}</strong></span>
                      <span>Target Staff: <strong>{selectedComplaint.targetPersonName || 'None'}</strong></span>
                      <span>Category: <strong>{selectedComplaint.category}</strong></span>
                    </div>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  {/* FAST ACTION BAR */}
                  <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-2xl space-y-2">
                    <span className="text-xs font-extrabold text-blue-900 block">
                      ⚡ Quick Department Actions / द्रुत कार्यहरू:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedComplaint.status === 'SUBMITTED' && (
                        <button
                          type="button"
                          onClick={handleQuickAcknowledge}
                          disabled={updating}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Acknowledge & Start Inquiry</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setModalStatus('ACTION_TAKEN');
                          setModalActionSummary(
                            'Department officer conducted thorough inquiry, addressed the reported concern, and instituted corrective measures.'
                          );
                          showToast('Resolution proposal template pre-filled', 'info');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pre-fill Action Taken / समाधान भएको</span>
                      </button>
                    </div>
                  </div>

                  {/* Status & Priority Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Status / अवस्था
                      </label>
                      <select
                        value={modalStatus}
                        onChange={(e) => setModalStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1b3b64]"
                      >
                        <option value="SUBMITTED">SUBMITTED (भर्खर दर्ता भएको)</option>
                        <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION (छानबिन जारी)</option>
                        <option value="ACTION_TAKEN">ACTION TAKEN (उपचारात्मक कदम चालिएको)</option>
                        <option value="RESOLVED">RESOLVED (पूर्ण रूपमा समाधान भएको)</option>
                        <option value="ESCALATED">ESCALATED (उच्च तहमा पठाइएको)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Department / शाखा
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedComplaint.department.nameEn}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                      />
                    </div>
                  </div>

                  {/* Public Action Summary (Visible to Patient) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Resolution Summary / सार्वजनिक समाधान विवरण{' '}
                      <span className="text-slate-400 font-normal">(Visible on patient tracking page)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={modalActionSummary}
                      onChange={(e) => setModalActionSummary(e.target.value)}
                      placeholder="e.g., Duty doctor counseled; prescription re-dispensed at hospital pharmacy without additional delay."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                  </div>

                  {/* Internal Inquiry Note / Findings */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Department Statement & Inquiry Findings / छानबिन विवरण
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalIsPublicNote}
                          onChange={(e) => setModalIsPublicNote(e.target.checked)}
                          className="rounded text-[#1b3b64] focus:ring-0"
                        />
                        <span>Make statement visible to patient on tracking timeline</span>
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={modalStatementNote}
                      onChange={(e) => setModalStatementNote(e.target.value)}
                      placeholder="Record clinical statements, interviews with on-duty staff, inspection of registers, or internal departmental findings..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                  </div>

                  {/* DEPARTMENT TRANSFER / RE-ASSIGNMENT ACCORDION */}
                  <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Transfer to Another Department / अन्य शाखामा स्थानान्तरण गर्नुहोस्
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      If this grievance belongs to another hospital unit (e.g. Pharmacy instead of Emergency), select the target department below.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Target Department
                        </label>
                        <select
                          value={transferTargetDeptId}
                          onChange={(e) => setTransferTargetDeptId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                        >
                          <option value="">-- Keep in {selectedComplaint.department.nameEn} --</option>
                          {allDepartments
                            .filter((d) => d.id !== selectedComplaint.departmentId)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.nameEn} ({d.code})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Transfer Reason
                        </label>
                        <input
                          type="text"
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          placeholder="e.g., Incident relates to billing counter, not ER"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeInvestigationModal}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 bg-[#1b3b64] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{updating ? 'Saving Changes...' : 'Save Statement & Actions'}</span>
                    </button>
                  </div>
                </form>
              ) : modalTab === 'MESSAGES' ? (
                /* TWO-WAY MESSAGING TAB */
                <div className="space-y-4 flex flex-col h-[480px]">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    {loadingMessages ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                        Loading dialogue history...
                      </div>
                    ) : complaintMessages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600">No messages exchanged yet</p>
                        <p className="text-[11px]">
                          Start a confidential dialogue with the patient to request specifics or clarify details.
                        </p>
                      </div>
                    ) : (
                      complaintMessages.map((m) => {
                        const isPatient = m.senderType === 'PATIENT';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 mb-1">
                              <span className="font-bold text-slate-600">{m.senderName}</span>
                              <span>•</span>
                              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                isPatient
                                  ? 'bg-white border border-slate-200 text-slate-800'
                                  : 'bg-[#1b3b64] text-white font-medium'
                              }`}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Insert Template Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Quick Inquiry Chips / द्रुत सोधपुछ:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => insertQuickTemplate('Could you please provide your Medical Bill or Cashier Receipt Number?')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium transition"
                      >
                        + Bill / Receipt No
                      </button>
                      <button
                        type="button"
                        onClick={() => insertQuickTemplate('Could you specify the exact Counter or Room Number where this occurred?')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium transition"
                      >
                        + Counter / Room No
                      </button>
                      <button
                        type="button"
                        onClick={() => insertQuickTemplate('Could you confirm the approximate time and doctor/nurse on duty?')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium transition"
                      >
                        + Shift & Duty Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => insertQuickTemplate('Our department is actively looking into this matter. We will update you shortly.')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg font-medium transition"
                      >
                        + Under Active Inquiry
                      </button>
                    </div>
                  </div>

                  {/* Message Input & Send */}
                  <form onSubmit={handleSendStaffMessage} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Type inquiry message to patient (dispatched directly to tracking page & WhatsApp)..."
                      value={staffMessageText}
                      onChange={(e) => setStaffMessageText(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                    <button
                      type="submit"
                      disabled={sendingStaffMessage || !staffMessageText.trim()}
                      className="px-4 py-2.5 bg-[#1b3b64] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingStaffMessage ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* QUALITY & CAPA AUDIT TAB FOR STAFF */
                <form onSubmit={handleSaveCapa} className="space-y-5">
                  {/* Header Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#1b3b64]" />
                        <h4 className="font-bold text-slate-900 text-sm">
                          Department Corrective & Preventive Action (CAPA)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        Record clinical findings, root causes, and systemic remedies for Quality Committee audit.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Status:</span>
                      <select
                        value={capaStatus}
                        onChange={(e) => setCapaStatus(e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-2 focus:ring-[#1b3b64]"
                      >
                        <option value="DRAFT">Draft / प्रारम्भिक</option>
                        <option value="PENDING_QA_REVIEW">Pending QA Review / समीक्षा बाँकी</option>
                        <option value="APPROVED_BY_QA">Approved by QA Committee / स्वीकृत</option>
                        <option value="CLOSED">Closed & Verified / बन्द तथा प्रमाणीकृत</option>
                      </select>
                    </div>
                  </div>

                  {/* 1. Root Cause Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Root Cause Category / मुख्य कारण वर्ग <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={capaRootCauseCategory}
                        onChange={(e) => setCapaRootCauseCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1b3b64]"
                      >
                        <option value="PROCESS_DEFECT">📋 Process / SOP / Protocol Defect</option>
                        <option value="COMMUNICATION_GAP">👥 Communication Breakdown / Attitude Gap</option>
                        <option value="EQUIPMENT_FAILURE">⚙️ Equipment Downtime / IT System Failure</option>
                        <option value="SUPPLY_SHORTAGE">💊 Supply Shortage / Drug Stockout</option>
                        <option value="STAFFING_WORKLOAD">⏳ High Patient-to-Staff Ratio / Fatigue</option>
                        <option value="INFRASTRUCTURE">🏢 Infrastructure / Cleanliness / Facilities</option>
                        <option value="HUMAN_ERROR">⚠️ Accidental Human Discrepancy / Slip</option>
                        <option value="OTHER">📁 Other Systemic Factor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Assigned Officer / जिम्मेवार अधिकृत
                      </label>
                      <input
                        type="text"
                        value={capaOfficerName}
                        onChange={(e) => setCapaOfficerName(e.target.value)}
                        placeholder="e.g., Dr. Ramesh / ER In-charge"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                      />
                    </div>
                  </div>

                  {/* 2. Root Cause Analysis */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Root Cause Analysis (Why-Why Diagnostic Finding) <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Detailed clinical/operational explanation of why this grievance occurred.
                    </p>
                    <textarea
                      rows={3}
                      required
                      value={capaRootCauseAnalysis}
                      onChange={(e) => setCapaRootCauseAnalysis(e.target.value)}
                      placeholder="e.g., Clinical duty roster review identified that during shift handover, the triage priority slip was misplaced..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                  </div>

                  {/* 3. Corrective Action */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Corrective Action (Immediate Patient Remedy) <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Immediate resolution step performed for the patient.
                    </p>
                    <textarea
                      rows={2}
                      required
                      value={capaCorrectiveAction}
                      onChange={(e) => setCapaCorrectiveAction(e.target.value)}
                      placeholder="e.g., Patient was attended to immediately by senior medical officer; apologies rendered and vitals stabilized..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                  </div>

                  {/* 4. Preventive Action */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Preventive Action (Department Quality Safeguard) <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Protocol change to ensure this never happens again.
                    </p>
                    <textarea
                      rows={3}
                      required
                      value={capaPreventiveAction}
                      onChange={(e) => setCapaPreventiveAction(e.target.value)}
                      placeholder="e.g., Instituted a digital handover register at triage desk; mandated verbal sign-off between incoming and outgoing nursing shifts..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                    />
                  </div>

                  {/* 5. Date & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Effectiveness Review Date
                      </label>
                      <input
                        type="date"
                        value={capaTargetReviewDate}
                        onChange={(e) => setCapaTargetReviewDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Department In-charge Remarks
                      </label>
                      <input
                        type="text"
                        value={capaNotes}
                        onChange={(e) => setCapaNotes(e.target.value)}
                        placeholder="Internal quality audit notes..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1b3b64]"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModalTab('INQUIRY')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                    >
                      Back to Inquiry
                    </button>
                    <button
                      type="submit"
                      disabled={savingCapa}
                      className="px-6 py-2.5 bg-[#1b3b64] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{savingCapa ? 'Saving & Auditing...' : 'Save & Audit CAPA Record'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
