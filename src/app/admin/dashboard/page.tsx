'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
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
} from 'lucide-react';

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
  actions: ActionLog[];
  feedback: { rating: number; comments: string | null } | null;
}

interface Stats {
  total: number;
  submitted: number;
  underInvestigation: number;
  actionTaken: number;
  resolved: number;
  rejected: number;
  escalated: number;
  avgRating: string;
  feedbackCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Selected Complaint for Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalPriority, setModalPriority] = useState('');
  const [modalActionSummary, setModalActionSummary] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalIsPublicNote, setModalIsPublicNote] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats', err);
    }
  };

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

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/complaints?status=${statusFilter}&departmentId=${deptFilter}&priority=${priorityFilter}`;
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

  useEffect(() => {
    fetchStats();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, deptFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const openActionModal = (c: Complaint) => {
    setSelectedComplaint(c);
    setModalStatus(c.status);
    setModalPriority(c.priority);
    setModalActionSummary(c.actionSummary || '');
    setModalNote('');
    setModalIsPublicNote(true);
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
          actionSummary: modalActionSummary,
          note: modalNote,
          isPublicNote: modalIsPublicNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setSelectedComplaint(null);
      fetchComplaints();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint');
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

      alert('Department created successfully!');
      setDeptNameEn('');
      setDeptNameNp('');
      setDeptCode('');
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
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

      alert('Unit created successfully!');
      setUnitNameEn('');
      setUnitNameNp('');
      setUnitCode('');
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to create unit');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const exportToCSV = () => {
    if (complaints.length === 0) return;
    const headers = [
      'Tracking ID',
      'Status',
      'Priority',
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
      `"${c.priority}"`,
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
    link.setAttribute('download', `Gunaso_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ADMIN HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Gunaso Admin Portal</h1>
              <p className="text-xs text-slate-400">Hospital Grievance Management & Review Committee</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department / Unit</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <span>Grievances Inbox & Filter Panel</span>
            </h2>

            {/* Quick Status Tabs */}
            <div className="flex flex-wrap gap-1.5 text-xs bg-slate-100 p-1 rounded-xl">
              {['ALL', 'SUBMITTED', 'UNDER_INVESTIGATION', 'ACTION_TAKEN', 'RESOLVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="sm:col-span-2 relative">
              <input
                type="text"
                placeholder="Search by Tracking ID, subject, staff, patient..."
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
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
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Department & Unit</th>
                  <th className="py-3.5 px-4">Target Staff</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading complaints data...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No complaints match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
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
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                          }`}
                        >
                          {c.status}
                        </span>
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
                        <button
                          onClick={() => openActionModal(c)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
              {/* TAB SELECTOR */}
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

              {/* FORM 1: CREATE DEPARTMENT */}
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
                /* FORM 2: CREATE UNIT */
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
                  Grievance Action Terminal
                </span>
                <h3 className="text-xl font-bold font-mono text-white">
                  {selectedComplaint.trackingId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateComplaint} className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Category: <strong>{selectedComplaint.category}</strong></span>
                  <span>Dept: <strong>{selectedComplaint.department.nameEn}</strong> {selectedComplaint.unit && `(${selectedComplaint.unit.nameEn})`}</span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {selectedComplaint.subject}
                </div>

                <div className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {selectedComplaint.description}
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                  <span>Location: {selectedComplaint.location}</span>
                  <span>Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Update Complaint Status *
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="SUBMITTED">SUBMITTED (New)</option>
                    <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                    <option value="ACTION_TAKEN">ACTION_TAKEN (Corrective Action Logged)</option>
                    <option value="RESOLVED">RESOLVED (Completed)</option>
                    <option value="REJECTED">REJECTED (Invalid / Duplicate)</option>
                    <option value="ESCALATED">ESCALATED (Medical Director)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Public Resolution Summary (Visible to Patient on Tracking Portal)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain findings and administrative action taken (e.g. Duty nurse counseled, refund issued...)"
                  value={modalActionSummary}
                  onChange={(e) => setModalActionSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Log Audit Entry / Note
                </label>
                <input
                  type="text"
                  placeholder="Internal or public note (e.g. Spoke with Dr. Karki on Oct 7)"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
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
                    Make this note public to the patient on tracking portal
                  </label>
                </div>
              </div>

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
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{updating ? 'Saving Changes...' : 'Save & Publish Updates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
