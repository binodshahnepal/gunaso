'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  ShieldAlert,
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
  Star,
  Download,
  Building2,
  Plus,
  Layers,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Key,
  Shield,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  RefreshCw,
  User,
  ArrowRight,
  Eye,
  MessageSquare,
  AlertCircle,
  Printer,
  BarChart3,
  TrendingUp,
  Zap,
  Activity,
  Timer,
  Award,
  ShieldCheck,
} from 'lucide-react';
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
  showConfirmDialog,
  showDeleteConfirm,
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
  feedback: { rating: number; comments: string | null } | null;
  slaDeadline?: string;
  isOverdue?: boolean;
  hoursOverdue?: number;
  hoursRemaining?: number;
  messages?: ComplaintMessage[];
  capa?: CapaRecord | null;
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

interface ComplaintMessage {
  id: string;
  senderType: string;
  senderName: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
}


interface DepartmentAnalytics {
  id: string;
  nameEn: string;
  code: string;
  slaHours: number;
  total: number;
  resolved: number;
  active: number;
  overdue: number;
  resolutionRate: number;
}

interface Stats {
  total: number;
  submitted: number;
  underInvestigation: number;
  actionTaken: number;
  resolved: number;
  rejected: number;
  escalated: number;
  overdueCount: number;
  slaComplianceRate: number;
  avgTurnaroundHours: string;
  avgRating: string;
  feedbackCount: number;
  priorityBreakdown?: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  categoryBreakdown?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  departmentAnalytics?: DepartmentAnalytics[];
  starDistribution?: Record<number, number>;
  recentFeedback?: Array<{
    id: string;
    rating: number;
    comments: string | null;
    createdAt: string;
    complaint?: {
      trackingId: string;
      subject: string;
      department?: { nameEn: string };
    };
  }>;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
  department?: {
    id: string;
    nameEn: string;
    nameNp: string;
    code: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    actions: number;
    assignedComplaints: number;
  };
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'GRIEVANCE_ADMIN' | 'DEPT_HEAD' | 'INVESTIGATOR';
  departmentId: string | null;
  department?: {
    id: string;
    nameEn: string;
    nameNp: string;
    code: string;
  } | null;
  _count?: {
    assignedComplaints: number;
    actions: number;
  };
}

interface NotificationItem {
  id: string;
  userId: string | null;
  complaintId: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  complaint?: {
    id: string;
    trackingId: string;
    subject: string;
    status: string;
    department?: { nameEn: string; code: string };
  } | null;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSecs < 60) return 'Just now';
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Current Logged-in Staff Session
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Tab View Modes
  const [dashboardTab, setDashboardTab] = useState<'MANAGEMENT' | 'ANALYTICS'>('MANAGEMENT');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'ALL' | '30D' | '7D'>('ALL');

  // Core Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'UNASSIGNED'>('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'OVERDUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [runningEscalation, setRunningEscalation] = useState(false);

  // Active Selected Complaint for Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalPriority, setModalPriority] = useState('');
  const [modalAssignedToId, setModalAssignedToId] = useState('');
  const [modalActionSummary, setModalActionSummary] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalIsPublicNote, setModalIsPublicNote] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Two-Way Messaging & CAPA in Modal
  const [modalActiveTab, setModalActiveTab] = useState<'ACTION' | 'MESSAGES' | 'CAPA'>('ACTION');
  const [complaintMessages, setComplaintMessages] = useState<ComplaintMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [adminMessageText, setAdminMessageText] = useState('');
  const [sendingAdminMessage, setSendingAdminMessage] = useState(false);

  // CAPA Form State
  const [capaRootCauseCategory, setCapaRootCauseCategory] = useState('PROCESS_DEFECT');
  const [capaRootCauseAnalysis, setCapaRootCauseAnalysis] = useState('');
  const [capaCorrectiveAction, setCapaCorrectiveAction] = useState('');
  const [capaPreventiveAction, setCapaPreventiveAction] = useState('');
  const [capaStatus, setCapaStatus] = useState('PENDING_QA_REVIEW');
  const [capaTargetReviewDate, setCapaTargetReviewDate] = useState('');
  const [capaOfficerName, setCapaOfficerName] = useState('');
  const [capaNotes, setCapaNotes] = useState('');
  const [loadingCapa, setLoadingCapa] = useState(false);
  const [savingCapa, setSavingCapa] = useState(false);


  // Department & Unit Creator Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [creatorTab, setCreatorTab] = useState<'DEPT' | 'UNIT'>('DEPT');
  const [creating, setCreating] = useState(false);

  // New Dept Form
  const [deptNameEn, setDeptNameEn] = useState('');
  const [deptNameNp, setDeptNameNp] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptSla, setDeptSla] = useState('48');

  // New Unit Form
  const [unitParentDeptId, setUnitParentDeptId] = useState('');
  const [unitNameEn, setUnitNameEn] = useState('');
  const [unitNameNp, setUnitNameNp] = useState('');
  const [unitCode, setUnitCode] = useState('');

  // Admin User Management Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<'LIST' | 'FORM'>('LIST');
  const [adminDeptFilter, setAdminDeptFilter] = useState('ALL');
  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Admin Form state
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminFormName, setAdminFormName] = useState('');
  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [adminFormPassword, setAdminFormPassword] = useState('');
  const [adminFormRole, setAdminFormRole] = useState('GRIEVANCE_ADMIN');
  const [adminFormDeptId, setAdminFormDeptId] = useState('');

  // 1. Fetch Current User Profile
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if ((data.user.role === 'DEPT_HEAD' || data.user.role === 'INVESTIGATOR') && data.user.departmentId) {
          setDeptFilter(data.user.departmentId);
        }
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Error fetching current user', err);
      router.push('/admin/login');
    }
  };

  // 2. Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  // 3. Fetch Stats
  const fetchStats = async (tf?: string) => {
    try {
      const selectedTf = tf || analyticsTimeframe;
      const res = await fetch(`/api/admin/stats?timeframe=${selectedTf}`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats', err);
    }
  };

  // 4. Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
        if (data.departments.length > 0) {
          setUnitParentDeptId(data.departments[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading departments', err);
    }
  };

  // 5. Fetch Admin & Staff Users
  const fetchAdminUsers = async () => {
    setLoadingAdmins(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
      } else {
        setAdminError(data.message || 'Failed to load administrators');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error loading administrators');
    } finally {
      setLoadingAdmins(false);
    }
  };

  // 6. Fetch Complaints
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/complaints?status=${statusFilter}&departmentId=${deptFilter}&priority=${priorityFilter}`;
      if (slaFilter === 'OVERDUE') {
        url += '&slaStatus=OVERDUE';
      }
      if (assignedFilter === 'ASSIGNED_TO_ME' && currentUser) {
        url += `&assignedToId=${currentUser.id}`;
      } else if (assignedFilter === 'UNASSIGNED') {
        url += `&assignedToId=UNASSIGNED`;
      }
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setComplaints(data.complaints);
    } catch (err) {
      console.error('Error loading complaints', err);
    } finally {
      setLoading(false);
    }
  };

  // 7. Auto-Escalation Scan Trigger
  const handleRunEscalation = async () => {
    const confirmed = await showConfirmDialog(
      'Run Automated SLA Escalation?',
      'This will scan all active unresolved grievances and automatically escalate any cases that have breached their department SLA deadline to Senior Hospital Management.',
      'Yes, Run Scan / स्क्यान सुरु गर्नुहोस्',
      'Cancel / रद्द गर्नुहोस्',
      true
    );
    if (!confirmed) {
      return;
    }

    setRunningEscalation(true);
    try {
      const res = await fetch('/api/admin/escalate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      await showSuccessAlert(
        'SLA Escalation Complete',
        data.message || 'SLA Escalation scan completed successfully.'
      );
      fetchComplaints();
      fetchStats();
      fetchNotifications();
    } catch (err: any) {
      await showErrorAlert(
        'Escalation Scan Failed',
        err.message || 'Failed to execute SLA escalation scan'
      );
    } finally {
      setRunningEscalation(false);
    }
  };

  // On Mount
  useEffect(() => {
    fetchCurrentUser();
    fetchStats();
    fetchDepartments();
    fetchAdminUsers();
    fetchNotifications();

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll Notifications every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Refetch complaints on filter changes
  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, deptFilter, priorityFilter, assignedFilter, slaFilter, currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const fetchComplaintMessages = async (complaintId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}/messages`);
      const data = await res.json();
      if (data.success && data.messages) {
        setComplaintMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openActionModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setModalActiveTab('ACTION');
    setModalStatus(c.status);
    setModalPriority(c.priority);
    setModalAssignedToId(c.assignedToId || '');
    setModalActionSummary(c.actionSummary || '');
    setModalNote('');
    setModalIsPublicNote(true);
    setComplaintMessages([]);
    setAdminMessageText('');
    fetchComplaintMessages(c.id);
    fetchCapaForComplaint(c.id);
  };

  const fetchCapaForComplaint = async (complaintId: string) => {
    setLoadingCapa(true);
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
      console.error('Failed to fetch CAPA record', err);
    } finally {
      setLoadingCapa(false);
    }
  };

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
          qaOfficerName: capaOfficerName.trim() || currentUser?.name || 'Quality Assurance Officer',
          qaNotes: capaNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showSuccessAlert(
          'CAPA Record Documented & Audited / क्यापा सुरक्षित भयो',
          `Corrective & Preventive Action for case ${selectedComplaint.trackingId} recorded under hospital quality standards.`
        );
        fetchComplaints();
      } else {
        showErrorAlert('Failed to Save CAPA', data.message);
      }
    } catch (err: any) {
      showErrorAlert('Error Saving CAPA', err.message || 'Server error while saving CAPA');
    } finally {
      setSavingCapa(false);
    }
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !adminMessageText.trim()) return;

    setSendingAdminMessage(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminMessageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setComplaintMessages((prev) => [...prev, data.data]);
      setAdminMessageText('');
      showToast('Message sent to patient & recorded in audit log', 'success');
      fetchComplaints();
    } catch (err: any) {
      showErrorAlert('Message Failed', err.message || 'Failed to send message');
    } finally {
      setSendingAdminMessage(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
    }
    setShowNotificationsDropdown(false);

    if (notif.complaint) {
      const found = complaints.find((c) => c.id === notif.complaint?.id);
      if (found) {
        openActionModal(found);
      } else {
        setSearchQuery(notif.complaint.trackingId);
        try {
          const res = await fetch(`/api/admin/complaints?search=${encodeURIComponent(notif.complaint.trackingId)}`);
          const data = await res.json();
          if (data.success && data.complaints.length > 0) {
            setComplaints(data.complaints);
            openActionModal(data.complaints[0]);
          }
        } catch (e) {}
      }
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalStatus,
          priority: modalPriority,
          assignedToId: modalAssignedToId || null,
          actionSummary: modalActionSummary,
          note: modalNote,
          isPublicNote: modalIsPublicNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setSelectedComplaint(null);
      showToast(`Grievance ${selectedComplaint.trackingId} updated successfully`, 'success');
      fetchComplaints();
      fetchStats();
      fetchAdminUsers();
      fetchNotifications();
    } catch (err: any) {
      showErrorAlert('Update Failed', err.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: deptNameEn,
          nameNp: deptNameNp,
          code: deptCode,
          slaHours: deptSla,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      await showSuccessAlert(
        'Department Created',
        `Department "${deptNameEn}" has been successfully added to the system.`
      );
      setDeptNameEn('');
      setDeptNameNp('');
      setDeptCode('');
      fetchDepartments();
    } catch (err: any) {
      showErrorAlert('Creation Failed', err.message || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: unitParentDeptId,
          nameEn: unitNameEn,
          nameNp: unitNameNp,
          code: unitCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      await showSuccessAlert(
        'Unit Created',
        `Unit "${unitNameEn}" has been successfully added to the system.`
      );
      setUnitNameEn('');
      setUnitNameNp('');
      setUnitCode('');
      fetchDepartments();
    } catch (err: any) {
      showErrorAlert('Creation Failed', err.message || 'Failed to create unit');
    } finally {
      setCreating(false);
    }
  };

  const openCreateAdminModal = () => {
    setEditingAdminId(null);
    setAdminFormName('');
    setAdminFormEmail('');
    setAdminFormPassword('');
    setAdminFormRole('DEPT_HEAD');
    setAdminFormDeptId(departments.length > 0 ? departments[0].id : '');
    setAdminError('');
    setAdminSuccess('');
    setAdminModalTab('FORM');
  };

  const openEditAdminModal = (user: AdminUser) => {
    setEditingAdminId(user.id);
    setAdminFormName(user.name);
    setAdminFormEmail(user.email);
    setAdminFormPassword('');
    setAdminFormRole(user.role);
    setAdminFormDeptId(user.departmentId || '');
    setAdminError('');
    setAdminSuccess('');
    setAdminModalTab('FORM');
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdmin(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const payload: any = {
        name: adminFormName.trim(),
        email: adminFormEmail.trim(),
        role: adminFormRole,
        departmentId: adminFormDeptId || null,
      };

      if (adminFormPassword.trim()) {
        payload.password = adminFormPassword.trim();
      }

      let res: Response;
      if (editingAdminId) {
        res = await fetch(`/api/admin/users/${editingAdminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        if (!adminFormPassword.trim()) {
          throw new Error('Password is required for a new staff / administrator account.');
        }
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed');
      }

      setAdminSuccess(data.message || 'User saved successfully!');
      fetchAdminUsers();
      setTimeout(() => {
        setAdminModalTab('LIST');
        setAdminSuccess('');
      }, 700);
    } catch (err: any) {
      setAdminError(err.message || 'Error saving user');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (currentUser?.id === id) {
      showWarningAlert('Action Denied', 'You cannot delete your own active administrator account.');
      return;
    }
    const confirmed = await showDeleteConfirm(
      name,
      'This user will lose access to the Grievance Administration portal immediately.'
    );
    if (!confirmed) {
      return;
    }
    setAdminError('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete user');
      }
      showToast(`User "${name}" deleted successfully`, 'success');
      fetchAdminUsers();
    } catch (err: any) {
      showErrorAlert('Deletion Failed', err.message || 'Error deleting user');
      setAdminError(err.message || 'Error deleting user');
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Sign Out / लगआउट?',
      'Are you sure you want to sign out of the Administrator Portal?',
      'Yes, Sign Out / लगआउट गर्नुहोस्',
      'Cancel / रद्द गर्नुहोस्'
    );
    if (!confirmed) return;

    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const exportToCSV = () => {
    if (complaints.length === 0) return;

    const headers = [
      'Tracking ID',
      'Status',
      'SLA Status',
      'Priority',
      'Assigned Officer',
      'Category',
      'Department',
      'Unit',
      'Target Person',
      'Filer Mode',
      'Patient Name',
      'Phone',
      'Incident Date',
      'Location',
      'Subject',
    ];

    const rows = complaints.map((c) => [
      `"${c.trackingId}"`,
      `"${c.status}"`,
      `"${c.isOverdue ? `Overdue (+${c.hoursOverdue}h)` : c.status === 'RESOLVED' ? 'Resolved' : `Within SLA (${c.hoursRemaining}h left)`}"`,
      `"${c.priority}"`,
      `"${c.assignedTo ? c.assignedTo.name : 'Unassigned'}"`,
      `"${c.category}"`,
      `"${c.department.nameEn}"`,
      `"${c.unit ? c.unit.nameEn : 'N/A'}"`,
      `"${c.targetPersonName || 'N/A'}"`,
      `"${c.isAnonymous ? 'Anonymous' : 'Identified'}"`,
      `"${c.patientName || 'Anonymous'}"`,
      `"${c.patientPhone || 'N/A'}"`,
      `"${new Date(c.incidentDate).toLocaleDateString()}"`,
      `"${c.location.replace(/"/g, '""')}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BPKMCH_Gunaso_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isCentralAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'GRIEVANCE_ADMIN';
  const isDeptStaff = currentUser?.role === 'DEPT_HEAD' || currentUser?.role === 'INVESTIGATOR';

  // Filtered Admin users in Staff Modal
  const filteredAdminUsers = adminUsers.filter((u) => {
    if (adminDeptFilter !== 'ALL' && u.departmentId !== adminDeptFilter) return false;
    if (adminRoleFilter !== 'ALL' && u.role !== adminRoleFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ADMIN HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Hospital Brand & Console Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/bkmch-logo.png"
                alt="BPKMCH Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white">
                  {isDeptStaff ? `${currentUser?.department?.nameEn || 'Department'} Console` : 'BPKMCH Gunaso Admin Portal'}
                </h1>
                {currentUser && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isSuperAdmin
                        ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                        : isCentralAdmin
                        ? 'bg-blue-900/80 text-blue-200 border border-blue-700'
                        : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                    }`}
                  >
                    {currentUser.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल •{' '}
                {currentUser ? `Signed in as ${currentUser.name}` : 'Grievance Management'}
              </p>
            </div>
          </div>

          {/* Action Bar Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* NOTIFICATIONS BELL */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700 flex items-center justify-center"
                title="Notifications"
              >
                {unreadCount > 0 ? (
                  <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-lg border border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 z-50 overflow-hidden">
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Notifications ({unreadCount} new)
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet. You are all caught up!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs flex gap-2.5 items-start ${
                            !n.isRead ? 'bg-amber-50/60 font-medium' : ''
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.isRead ? 'bg-amber-500' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                              <span className="text-[10px] text-slate-400">{formatTimeAgo(n.createdAt)}</span>
                            </div>
                            <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                            {n.complaint && (
                              <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <span>{n.complaint.trackingId}</span>
                                <span>• {n.complaint.status}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                    <button
                      onClick={() => fetchNotifications()}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh alerts</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SLA AUTO-ESCALATE BUTTON */}
            {isCentralAdmin && (
              <button
                onClick={handleRunEscalation}
                disabled={runningEscalation}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                title="Scan all active grievances and automatically escalate cases exceeding their department SLA hours"
              >
                <Zap className={`w-4 h-4 ${runningEscalation ? 'animate-spin' : ''}`} />
                <span>{runningEscalation ? 'Scanning...' : 'Auto-Escalate Overdue'}</span>
              </button>
            )}

            {/* SUPER ADMIN: MANAGE STAFF & ADMINS */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setShowAdminModal(true);
                  setAdminModalTab('LIST');
                  fetchAdminUsers();
                }}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Users className="w-4 h-4" />
                <span>Manage Users & Staff</span>
              </button>
            )}

            {/* CENTRAL ADMIN: ADD DEPT / UNIT */}
            {isCentralAdmin && (
              <button
                onClick={() => setShowDeptModal(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dept / Unit</span>
              </button>
            )}

            {/* SWITCH TO STAFF / DEPT WORKSPACE */}
            <Link
              href="/staff/dashboard"
              className="px-3.5 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold rounded-lg transition-colors border border-indigo-700 flex items-center gap-1.5"
              title="Open Dedicated Department Officer Workspace"
            >
              <Building2 className="w-4 h-4" />
              <span>Dept Desk</span>
            </Link>

            {/* CSV EXPORT */}
            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg transition-colors border border-rose-800 flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* TOP LEVEL VIEW SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDashboardTab('MANAGEMENT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                dashboardTab === 'MANAGEMENT'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Grievance Inquiries & Management</span>
            </button>

            <button
              onClick={() => {
                setDashboardTab('ANALYTICS');
                fetchStats();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                dashboardTab === 'ANALYTICS'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Executive BI Analytics & Insights</span>
              {stats?.overdueCount !== undefined && stats.overdueCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {stats.overdueCount} Overdue
                </span>
              )}
            </button>
          </div>

          {dashboardTab === 'ANALYTICS' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <span className="text-slate-400 text-[11px] px-2">Timeframe:</span>
              {(['ALL', '30D', '7D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setAnalyticsTimeframe(tf);
                    fetchStats(tf);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    analyticsTimeframe === tf
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf === 'ALL' ? 'All Time' : tf === '30D' ? 'Last 30 Days' : 'Last 7 Days'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: EXECUTIVE BI ANALYTICS & INSIGHTS */}
        {/* ========================================================================= */}
        {dashboardTab === 'ANALYTICS' && stats && (
          <div className="space-y-6">
            {/* Top 4 KPI Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Resolution Rate */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Hospital Resolution Rate</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{stats.resolved} Closed</span>
                  <span>{stats.total} Lodged</span>
                </div>
              </div>

              {/* Card 2: SLA Quality Compliance */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>SLA Target Compliance</span>
                  <Timer className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                  <span>{stats.slaComplianceRate}%</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      stats.slaComplianceRate >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : stats.slaComplianceRate >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {stats.slaComplianceRate >= 80 ? 'Optimal' : 'Needs Focus'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.slaComplianceRate}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>On-time Resolution</span>
                  <span className="text-rose-600 font-bold">{stats.overdueCount} Overdue</span>
                </div>
              </div>

              {/* Card 3: Avg Turnaround Hours */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Avg Turnaround Time</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                  <span>{stats.avgTurnaroundHours}</span>
                  <span className="text-sm font-bold text-slate-500">Hours</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Average duration from complaint intake to verified closure across hospital departments.
                </p>
              </div>

              {/* Card 4: CSAT Rating */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Patient Satisfaction Index</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-amber-500 flex items-center gap-1.5">
                  <span>{stats.avgRating}</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(parseFloat(stats.avgRating))
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Calculated from <strong>{stats.feedbackCount}</strong> verified patient satisfaction ratings.
                </div>
              </div>
            </div>

            {/* Middle Grid: Department Efficiency & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Efficiency Matrix */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Departmental Resolution & Workload Matrix
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Target vs Performance</span>
                </div>

                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {stats.departmentAnalytics && stats.departmentAnalytics.length > 0 ? (
                    stats.departmentAnalytics.map((dept) => (
                      <div key={dept.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{dept.nameEn}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {dept.code}
                            </span>
                          </div>
                          <span className="text-emerald-700 font-extrabold">{dept.resolutionRate}% Resolved</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              dept.resolutionRate >= 80
                                ? 'bg-emerald-600'
                                : dept.resolutionRate >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${dept.resolutionRate}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Total: <strong>{dept.total}</strong></span>
                          <span>Active: <strong className="text-blue-700">{dept.active}</strong></span>
                          <span>Resolved: <strong className="text-emerald-700">{dept.resolved}</strong></span>
                          <span>Overdue: <strong className="text-rose-600">{dept.overdue}</strong></span>
                          <span>SLA Standard: <strong className="text-slate-700">{dept.slaHours}h</strong></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No departmental data in selected timeframe.</div>
                  )}
                </div>
              </div>

              {/* Category Breakdown & Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-700" />
                    <h3 className="font-bold text-slate-900 text-sm">Grievance Category Distribution</h3>
                  </div>
                  <span className="text-xs text-slate-400">% Share</span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                    stats.categoryBreakdown.map((cat) => (
                      <div key={cat.category} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-800 font-semibold">
                          <span>{cat.category.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-slate-600 font-bold">
                            {cat.count} cases ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400">No category breakdown available.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Grid: Patient Satisfaction Breakdown & Priority Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CSAT 5-Star Distribution */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Patient Rating Distribution</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = stats.starDistribution ? stats.starDistribution[stars] || 0 : 0;
                    const pct = stats.feedbackCount > 0 ? Math.round((count / stats.feedbackCount) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                          <span>{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-[11px] text-slate-500 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Distribution Matrix */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Grievance Priority Severity</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Critical</span>
                    <div className="text-2xl font-black text-rose-800">
                      {stats.priorityBreakdown?.CRITICAL || 0}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">High</span>
                    <div className="text-2xl font-black text-amber-800">
                      {stats.priorityBreakdown?.HIGH || 0}
                    </div>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Medium</span>
                    <div className="text-2xl font-black text-slate-800">
                      {stats.priorityBreakdown?.MEDIUM || 0}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center space-y-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Low</span>
                    <div className="text-2xl font-black text-blue-800">
                      {stats.priorityBreakdown?.LOW || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patient Feedback Comments */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Recent Patient Testimonials</h3>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto text-xs">
                  {stats.recentFeedback && stats.recentFeedback.length > 0 ? (
                    stats.recentFeedback.map((fb) => (
                      <div key={fb.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= fb.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          {fb.complaint && (
                            <span className="font-mono text-[10px] text-slate-500 font-bold">
                              {fb.complaint.trackingId}
                            </span>
                          )}
                        </div>
                        {fb.comments && <p className="text-slate-700 italic text-[11px]">&quot;{fb.comments}&quot;</p>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 italic">No feedback comments recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: GRIEVANCE INBOX & ACTION WORKFLOW */}
        {/* ========================================================================= */}
        {dashboardTab === 'MANAGEMENT' && (
          <div className="space-y-6">
            {/* STATS METRICS ROW */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Grievances</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-amber-600 font-semibold">Submitted (New)</div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.submitted}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-blue-600 font-semibold">In Investigation</div>
                  <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.underInvestigation}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-purple-600 font-semibold">Action Initiated</div>
                  <div className="text-2xl font-extrabold text-purple-600 mt-1">{stats.actionTaken}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-emerald-600 font-semibold">Resolved</div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.resolved}</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Avg Satisfaction</div>
                  <div className="text-2xl font-extrabold text-amber-500 mt-1 flex items-center gap-1">
                    <span>{stats.avgRating}</span>
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                </div>
              </div>
            )}

            {/* FILTERS TOOLBAR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-900 text-base">Grievance Case Inbox & Filters</h2>
                </div>

                {/* Quick Assignment / View Mode Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setAssignedFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        assignedFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Cases
                    </button>
                    {currentUser && (
                      <button
                        onClick={() => setAssignedFilter('ASSIGNED_TO_ME')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                          assignedFilter === 'ASSIGNED_TO_ME'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>Assigned to Me</span>
                        {currentUser._count?.assignedComplaints ? (
                          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                            {currentUser._count.assignedComplaints}
                          </span>
                        ) : null}
                      </button>
                    )}
                    <button
                      onClick={() => setAssignedFilter('UNASSIGNED')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        assignedFilter === 'UNASSIGNED'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Needs Assignment
                    </button>
                  </div>

                  {/* Overdue SLA Filter Button */}
                  <button
                    onClick={() => setSlaFilter(slaFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      slaFilter === 'OVERDUE'
                        ? 'bg-rose-700 text-white shadow-sm animate-pulse'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>SLA Breached / Overdue</span>
                    {stats?.overdueCount !== undefined && stats.overdueCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {stats.overdueCount}
                      </span>
                    )}
                  </button>

                  {/* Quick Status Filter Tabs */}
                  <div className="flex flex-wrap gap-1 text-xs bg-slate-100 p-1 rounded-xl">
                    {['ALL', 'SUBMITTED', 'UNDER_INVESTIGATION', 'ACTION_TAKEN', 'RESOLVED', 'REJECTED', 'ESCALATED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          statusFilter === st
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Filter Dropdowns & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="sm:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Search by Tracking ID, subject, staff, patient phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </form>

                {/* Department Filter */}
                <div>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameEn} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COMPLAINTS DATA TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                      <th className="py-3.5 px-4">Tracking ID</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">SLA Target & Status</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Department & Subject</th>
                      <th className="py-3.5 px-4">Assigned Handler</th>
                      <th className="py-3.5 px-4">Target Person</th>
                      <th className="py-3.5 px-4">Submitted By</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          Loading complaints data...
                        </td>
                      </tr>
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          No complaints match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c) => {
                        const isAssignedToMe = currentUser && c.assignedToId === currentUser.id;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                              {c.trackingId}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                  c.status === 'RESOLVED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : c.status === 'SUBMITTED'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : c.status === 'UNDER_INVESTIGATION'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : c.status === 'ESCALATED'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-purple-100 text-purple-800 border border-purple-300'
                                }`}
                              >
                                {c.status.replace(/_/g, ' ')}
                              </span>
                            </td>

                            {/* SLA Target & Overdue Status Column */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {c.status === 'RESOLVED' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Resolved
                                </span>
                              ) : c.status === 'REJECTED' ? (
                                <span className="text-[10px] text-slate-400 font-mono">Closed</span>
                              ) : c.isOverdue ? (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center gap-1 font-black text-[10px] text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Overdue (+{c.hoursOverdue}h)
                                  </span>
                                  <span className="text-[10px] text-rose-600 font-medium mt-0.5">
                                    Target: {c.department.slaHours || 48}h SLA
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    {c.hoursRemaining}h remaining
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    Target: {c.department.slaHours || 48}h
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-bold">
                              <span
                                className={`${
                                  c.priority === 'CRITICAL'
                                    ? 'text-rose-600'
                                    : c.priority === 'HIGH'
                                    ? 'text-amber-600'
                                    : 'text-slate-600'
                                }`}
                              >
                                {c.priority}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{c.subject}</div>
                              <div className="text-[11px] text-slate-500">
                                {c.department.nameEn}
                                {c.unit && <span className="text-emerald-700 font-semibold"> • {c.unit.nameEn}</span>}
                              </div>
                            </td>

                            {/* Assigned Handler */}
                            <td className="py-3.5 px-4">
                              {c.assignedTo ? (
                                <div className="flex flex-col">
                                  <span
                                    className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                                      isAssignedToMe ? 'text-emerald-700 font-bold' : 'text-slate-800'
                                    }`}
                                  >
                                    <User className="w-3 h-3 text-slate-400" />
                                    {c.assignedTo.name}
                                    {isAssignedToMe && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 rounded font-bold">
                                        YOU
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {c.assignedTo.role.replace(/_/g, ' ').toLowerCase()}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <AlertCircle className="w-3 h-3" />
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-700">
                              {c.targetPersonName ? (
                                <div>
                                  <span className="font-semibold text-slate-900">{c.targetPersonName}</span>
                                  {c.targetPersonRole && (
                                    <span className="text-slate-400 block text-[10px]">({c.targetPersonRole})</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {c.isAnonymous ? (
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                  Anonymous
                                </span>
                              ) : (
                                <div>
                                  <span className="font-semibold text-slate-900">{c.patientName}</span>
                                  <span className="text-slate-400 block text-[10px]">{c.patientPhone}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/admin/complaints/${c.trackingId}/dossier`}
                                  target="_blank"
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
                                  title="Print Official Case Dossier"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  onClick={() => openActionModal(c)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                                >
                                  <span>{isDeptStaff ? 'Update Progress' : 'Review & Assign'}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* STAFF & ADMINISTRATOR MANAGEMENT MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden space-y-6 my-8">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Staff & Administrator Management</h3>
                  <p className="text-xs text-slate-400">
                    Create departmental investigation officers, assign departments, and manage admin credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAdminModalTab('LIST');
                      setAdminError('');
                      setAdminSuccess('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      adminModalTab === 'LIST'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Accounts ({adminUsers.length})
                  </button>
                  <button
                    onClick={openCreateAdminModal}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      adminModalTab === 'FORM' && !editingAdminId
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Create New Staff / Admin</span>
                  </button>
                </div>

                {adminModalTab === 'LIST' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={adminDeptFilter}
                      onChange={(e) => setAdminDeptFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn}
                        </option>
                      ))}
                    </select>

                    <select
                      value={adminRoleFilter}
                      onChange={(e) => setAdminRoleFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="GRIEVANCE_ADMIN">Grievance Admin</option>
                      <option value="DEPT_HEAD">Dept Head</option>
                      <option value="INVESTIGATOR">Investigator</option>
                    </select>
                  </div>
                )}
              </div>

              {adminError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}
              {adminSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{adminSuccess}</span>
                </div>
              )}

              {/* LIST VIEW */}
              {adminModalTab === 'LIST' && (
                <div className="space-y-3">
                  {loadingAdmins ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading staff accounts...</div>
                  ) : filteredAdminUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">No users match filter criteria.</div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="py-2.5 px-3.5">Name & Email</th>
                            <th className="py-2.5 px-3.5">Role</th>
                            <th className="py-2.5 px-3.5">Department</th>
                            <th className="py-2.5 px-3.5">Assigned Cases</th>
                            <th className="py-2.5 px-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAdminUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {currentUser?.id === u.id && (
                                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                    u.role === 'SUPER_ADMIN'
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : u.role === 'GRIEVANCE_ADMIN'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : u.role === 'DEPT_HEAD'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {u.role.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-slate-600">
                                {u.department ? (
                                  <span className="font-semibold text-slate-800">
                                    {u.department.nameEn} ({u.department.code})
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Hospital-wide</span>
                                )}
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                  {u._count?.assignedComplaints || 0} active
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditAdminModal(u)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                                  title="Edit Staff Member"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={currentUser?.id === u.id}
                                  onClick={() => handleDeleteAdmin(u.id, u.name)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    currentUser?.id === u.id
                                      ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  }`}
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CREATE / EDIT FORM */}
              {adminModalTab === 'FORM' && (
                <form onSubmit={handleSaveAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Ramesh Sharma"
                        value={adminFormName}
                        onChange={(e) => setAdminFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address (Used for Login) *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh.radiology@hospital.gov.np"
                        value={adminFormEmail}
                        onChange={(e) => setAdminFormEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password {editingAdminId ? '(Leave blank to keep current)' : '*'}
                      </label>
                      <input
                        type="password"
                        required={!editingAdminId}
                        placeholder={editingAdminId ? 'Enter new password to update' : 'Min 6 characters'}
                        value={adminFormPassword}
                        onChange={(e) => setAdminFormPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Role & Permissions *
                      </label>
                      <select
                        value={adminFormRole}
                        onChange={(e) => setAdminFormRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DEPT_HEAD">DEPT_HEAD (Department Head / In-charge)</option>
                        <option value="INVESTIGATOR">INVESTIGATOR (Department Investigation Staff)</option>
                        <option value="GRIEVANCE_ADMIN">GRIEVANCE_ADMIN (Central Review Committee)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Administrator)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Department {adminFormRole === 'DEPT_HEAD' || adminFormRole === 'INVESTIGATOR' ? '(Required for Department Staff)' : '(Optional)'}
                    </label>
                    <select
                      value={adminFormDeptId}
                      onChange={(e) => setAdminFormDeptId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Hospital-wide / Central Administration</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAdminModalTab('LIST')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingAdmin}
                      className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {savingAdmin ? 'Saving...' : editingAdminId ? 'Save Changes' : 'Create Staff Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT & UNIT CREATOR MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden space-y-6">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Manage Departments & Units</h3>
              </div>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
                <button
                  onClick={() => setCreatorTab('DEPT')}
                  className={`pb-2 transition-colors ${
                    creatorTab === 'DEPT'
                      ? 'border-b-2 border-emerald-600 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ➕ Create New Department
                </button>
                <button
                  onClick={() => setCreatorTab('UNIT')}
                  className={`pb-2 transition-colors ${
                    creatorTab === 'UNIT'
                      ? 'border-b-2 border-emerald-600 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ➕ Create New Unit (Under Department)
                </button>
              </div>

              {creatorTab === 'DEPT' ? (
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pediatrics Department"
                      value={deptNameEn}
                      onChange={(e) => setDeptNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department Name (Nepali)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. बालरोग विभाग"
                      value={deptNameNp}
                      onChange={(e) => setDeptNameNp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unique Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PED"
                        value={deptCode}
                        onChange={(e) => setDeptCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SLA Hours
                      </label>
                      <input
                        type="number"
                        placeholder="48"
                        value={deptSla}
                        onChange={(e) => setDeptSla(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    {creating ? 'Saving...' : 'Create Department'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateUnit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parent Department *
                    </label>
                    <select
                      value={unitParentDeptId}
                      onChange={(e) => setUnitParentDeptId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neonatal Ward / Triage Unit"
                      value={unitNameEn}
                      onChange={(e) => setUnitNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Name (Nepali)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. नवजात शिशु कक्ष"
                      value={unitNameNp}
                      onChange={(e) => setUnitNameNp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unique Unit Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PED-NEO"
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    {creating ? 'Saving...' : 'Create Hospital Unit'}
                  </button>
                </form>
              )}

              {/* EXISTING DEPARTMENTS & UNITS LIST TREE */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Existing Department & Unit Hierarchy:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                  {departments.map((d) => (
                    <div key={d.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>🏢 {d.nameEn} ({d.code})</span>
                        <span className="text-[10px] text-slate-500 font-normal">SLA: {d.slaHours}h</span>
                      </div>
                      {d.units && d.units.length > 0 ? (
                        <div className="mt-1 pl-4 border-l-2 border-emerald-500 space-y-0.5 text-slate-600 text-[11px]">
                          {d.units.map((u) => (
                            <div key={u.id}>• {u.nameEn} <span className="text-slate-400">({u.code})</span></div>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-4 text-[10px] text-slate-400 italic">No units created yet.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTION & INVESTIGATION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-8 space-y-6">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-mono font-bold uppercase">
                  Grievance Action & Investigation Terminal
                </span>
                <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  <span>{selectedComplaint.trackingId}</span>
                  <span className="text-xs font-normal text-slate-400">
                    (PIN: <span className="font-mono text-amber-300">{selectedComplaint.pin}</span>)
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/complaints/${selectedComplaint.trackingId}/dossier`}
                  target="_blank"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Open Official Case Dossier & Print Investigation Report"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Case Dossier</span>
                </Link>

                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL TABS */}
            <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-6">
              <button
                type="button"
                onClick={() => setModalActiveTab('ACTION')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  modalActiveTab === 'ACTION'
                    ? 'border-[#27548b] text-[#27548b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Action & Investigation</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('MESSAGES')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  modalActiveTab === 'MESSAGES'
                    ? 'border-[#27548b] text-[#27548b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Two-Way Patient Dialogue</span>
                {complaintMessages.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#27548b] font-bold">
                    {complaintMessages.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('CAPA')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  modalActiveTab === 'CAPA'
                    ? 'border-[#27548b] text-[#27548b]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Quality & CAPA Audit</span>
                {selectedComplaint.capa && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    Audited
                  </span>
                )}
              </button>
            </div>

            {modalActiveTab === 'ACTION' ? (
              <form onSubmit={handleUpdateComplaint} className="p-6 space-y-6">
              {/* COMPLAINT DETAILS SUMMARY */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                  <span>
                    Category: <strong className="text-slate-800">{selectedComplaint.category}</strong>
                  </span>
                  <span>
                    Department: <strong className="text-slate-800">{selectedComplaint.department.nameEn}</strong>{' '}
                    {selectedComplaint.unit && `(${selectedComplaint.unit.nameEn})`}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">{selectedComplaint.subject}</div>

                <div className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px] pt-1">
                  <span>
                    Location: <strong className="text-slate-700">{selectedComplaint.location}</strong>
                  </span>
                  <span>
                    Patient:{' '}
                    <strong className="text-slate-700">
                      {selectedComplaint.isAnonymous
                        ? 'Anonymous'
                        : `${selectedComplaint.patientName || 'N/A'} (${selectedComplaint.patientPhone || 'N/A'})`}
                    </strong>
                  </span>
                  <span>Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* ACTION HISTORY AUDIT LOG */}
              {selectedComplaint.actions && selectedComplaint.actions.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Case Timeline & Investigation Activity ({selectedComplaint.actions.length})</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-2 divide-y divide-slate-100">
                    {selectedComplaint.actions.map((act) => (
                      <div key={act.id} className="pt-2 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                              {act.actionType}
                            </span>
                            {act.actor && (
                              <span className="text-slate-600">
                                by <span className="font-bold text-slate-900">{act.actor.name}</span> ({act.actor.role.replace('_', ' ')})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{formatTimeAgo(act.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] pl-1">{act.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATUS & PRIORITY DROPDOWNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Update Complaint Status *
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SUBMITTED">SUBMITTED (New Grievance)</option>
                    <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION (Inquiry in Progress)</option>
                    <option value="ACTION_TAKEN">ACTION_TAKEN (Corrective Steps Logged)</option>
                    <option value="RESOLVED">RESOLVED (Complaint Closed)</option>
                    <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                    <option value="ESCALATED">ESCALATED (Medical Director Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* ASSIGN TO DEPARTMENT STAFF / INVESTIGATION OFFICER */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <UserCheck className="w-4 h-4 text-blue-700" />
                    <span>Assign to Department Officer / Handler</span>
                  </span>
                  {selectedComplaint.assignedTo && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      Currently: {selectedComplaint.assignedTo.name}
                    </span>
                  )}
                </label>
                <select
                  value={modalAssignedToId}
                  onChange={(e) => setModalAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Unassigned (No Officer Assigned) --</option>
                  <optgroup label={`Department Match (${selectedComplaint.department.nameEn})`}>
                    {adminUsers
                      .filter((u) => u.departmentId === selectedComplaint.departmentId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          ⭐ {u.name} — {u.role.replace(/_/g, ' ')} ({u._count?.assignedComplaints || 0} active cases)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Other Hospital Staff & Admins">
                    {adminUsers
                      .filter((u) => u.departmentId !== selectedComplaint.departmentId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.department ? u.department.nameEn : 'Hospital Admin'} ({u.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-blue-700">
                  Assigning an officer will alert them in their dashboard and trigger an SMS / WhatsApp status update to the patient.
                </p>
              </div>

              {/* RESOLUTION SUMMARY (VISIBLE TO PATIENT) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Public Resolution Summary (Visible to Patient on Tracking Portal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain findings and administrative/departmental action taken (e.g. Duty doctor counseled, pharmacy stock replenished, refund processed...)"
                  value={modalActionSummary}
                  onChange={(e) => setModalActionSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* LOG AUDIT ENTRY / NOTE */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Log Audit Entry / Progress Note
                </label>
                <input
                  type="text"
                  placeholder="Note on investigation progress (e.g. Interviewed night-shift nurse, verified billing slip)"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isPublicNote"
                    checked={modalIsPublicNote}
                    onChange={(e) => setModalIsPublicNote(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isPublicNote" className="text-xs text-slate-600">
                    Make this note visible to the patient on the tracking portal
                  </label>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updating ? 'Saving & Notifying...' : 'Save & Publish Updates'}</span>
                </button>
              </div>
              </form>
            ) : modalActiveTab === 'MESSAGES' ? (
              <div className="p-6 space-y-6">
                {/* MESSAGES THREAD HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#27548b]" />
                      <span>
                        Dialogue with Complainant ({selectedComplaint.isAnonymous ? 'Anonymous Filer' : (selectedComplaint.patientName || 'Patient')})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Messages sent here are visible to the patient on their tracking link.
                    </p>
                  </div>
                  {selectedComplaint.patientPhone ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      📱 WhatsApp Notifications Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🔑 Web Tracking Link Only
                    </span>
                  )}
                </div>

                {/* MESSAGES LIST */}
                <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#27548b]" />
                      <span>Loading conversation history...</span>
                    </div>
                  ) : complaintMessages.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No messages in this case yet.</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Use the box below to ask the patient for additional details, bill slips, or incident specifics.
                      </p>
                    </div>
                  ) : (
                    complaintMessages.map((msg) => {
                      const isStaff = msg.senderType === 'STAFF' || msg.senderType === 'ADMIN';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                            <span className="font-bold text-slate-700">
                              {isStaff ? `🏥 ${msg.senderName}` : `👤 ${msg.senderName}`}
                            </span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div
                            className={`max-w-lg rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                              isStaff
                                ? 'bg-[#27548b] text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* REPLY FORM */}
                <form onSubmit={handleSendAdminMessage} className="space-y-3">
                  <textarea
                    rows={3}
                    value={adminMessageText}
                    onChange={(e) => setAdminMessageText(e.target.value)}
                    placeholder="Type inquiry or update for the patient (e.g. request bill slip number, clarify incident time)..."
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#27548b] placeholder:text-slate-400"
                  />

                  {/* QUICK INQUIRIES */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Quick templates:</span>
                    <button
                      type="button"
                      onClick={() => setAdminMessageText('Please provide your bill receipt or token number so we can verify the transaction.')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      Request Bill Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminMessageText('Could you please specify which counter or room number you visited, and the approximate time?')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      Clarify Counter/Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminMessageText('We have initiated an inquiry with the duty staff and will update you shortly.')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      Investigation Ongoing
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setModalActiveTab('ACTION')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                    >
                      Back to Action Form
                    </button>
                    <button
                      type="submit"
                      disabled={sendingAdminMessage || !adminMessageText.trim()}
                      className="px-5 py-2.5 bg-[#27548b] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {sendingAdminMessage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending to Patient...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message to Patient</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* QUALITY & CAPA AUDIT TAB */
              <form onSubmit={handleSaveCapa} className="p-6 space-y-5">
                {/* Header Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#27548b]" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Corrective & Preventive Action (CAPA) Governance Desk
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      Document the formal Root Cause Analysis (RCA) and systemic hospital-wide quality measures.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Status:</span>
                    <select
                      value={capaStatus}
                      onChange={(e) => setCapaStatus(e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-2 focus:ring-[#27548b]"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#27548b] focus:bg-white"
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
                      Assigned QA Officer / गुणस्तर अधिकृत
                    </label>
                    <input
                      type="text"
                      value={capaOfficerName}
                      onChange={(e) => setCapaOfficerName(e.target.value)}
                      placeholder="e.g., Dr. Quality Lead / Clinical Auditor"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b] focus:bg-white"
                    />
                  </div>
                </div>

                {/* 2. Root Cause Analysis (Why-Why Analysis) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Root Cause Analysis (Why-Why Diagnostic Finding) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Detailed diagnostic explanation of why this grievance occurred (underlying systemic, communication, or clinical gap).
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={capaRootCauseAnalysis}
                    onChange={(e) => setCapaRootCauseAnalysis(e.target.value)}
                    placeholder="e.g., Investigation confirmed that during morning shift changeover, OPD pharmacy barcode scanner experienced an intermittent network dropout..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b] focus:bg-white"
                  />
                </div>

                {/* 3. Corrective Action (Immediate Remedy) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Corrective Action (Immediate Patient Remedy) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    What immediate remedial step was taken to resolve the grievance for the affected complainant?
                  </p>
                  <textarea
                    rows={2}
                    required
                    value={capaCorrectiveAction}
                    onChange={(e) => setCapaCorrectiveAction(e.target.value)}
                    placeholder="e.g., Complainant was provided with the corrected invoice, refunded excess charge, and received the prescribed medication immediately..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b] focus:bg-white"
                  />
                </div>

                {/* 4. Preventive Action (Hospital-Wide Change) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Preventive Action (Hospital-Wide Systemic Quality Safeguard) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    What systemic change, SOP update, or preventive training has been instituted hospital-wide to prevent recurrence?
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={capaPreventiveAction}
                    onChange={(e) => setCapaPreventiveAction(e.target.value)}
                    placeholder="e.g., Instituted a dual-verification checklist at OPD pharmacy counter; upgraded network access point in Room 14; conducted shift-handover protocol training..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b] focus:bg-white"
                  />
                </div>

                {/* 5. Target Review Date & Committee Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Effectiveness Review Target Date
                    </label>
                    <input
                      type="date"
                      value={capaTargetReviewDate}
                      onChange={(e) => setCapaTargetReviewDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quality Committee Audit Notes
                    </label>
                    <input
                      type="text"
                      value={capaNotes}
                      onChange={(e) => setCapaNotes(e.target.value)}
                      placeholder="Optional remarks from Medical Superintendent or QA audit..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#27548b]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('ACTION')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Back to Action Form
                  </button>
                  <button
                    type="submit"
                    disabled={savingCapa}
                    className="px-6 py-2.5 bg-[#27548b] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{savingCapa ? 'Saving & Auditing...' : 'Save & Audit CAPA Record'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
