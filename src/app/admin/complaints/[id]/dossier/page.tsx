'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Shield,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Download,
  Share2,
  MessageSquare,
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
    email: string;
  } | null;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
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
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: Department | null;
  } | null;
  actions: ActionLog[];
  attachments?: Attachment[];
  messages?: ComplaintMessage[];
    feedback?: {
    rating: number;
    comments: string | null;
    createdAt: string;
  } | null;
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


export default function ComplaintDossierPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!complaintId) return;

    const fetchComplaint = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/admin/complaints/${complaintId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Complaint not found');
        }
        setComplaint(data.complaint);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load case dossier');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [complaintId]);

  const handlePrint = () => {
    window.print();
  };

  const calculateTurnaround = (createdAt: string, resolvedAt: string | null) => {
    if (!resolvedAt) return null;
    const start = new Date(createdAt).getTime();
    const end = new Date(resolvedAt).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 1) {
      const mins = Math.max(1, Math.round((end - start) / (1000 * 60)));
      return `${mins} Minutes`;
    }
    return `${diffHours.toFixed(1)} Hours`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4 max-w-sm w-full">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Generating Official Case Dossier...</h2>
          <p className="text-xs text-slate-500">Compiling grievance timeline, investigation audit, and committee records.</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-rose-200 text-center space-y-4 max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Case Dossier Unavailable</h2>
          <p className="text-xs text-slate-600">{errorMsg || 'The requested complaint could not be found.'}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
          >
            Return to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  const turnaroundTime = calculateTurnaround(complaint.createdAt, complaint.resolvedAt);
  const slaTarget = complaint.department?.slaHours || 48;
  const isSlaBreached = turnaroundTime ? parseFloat(turnaroundTime) > slaTarget : false;

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-sans print:bg-white print:p-0">
      {/* SCREEN CONTROLS BAR (Hidden when printed) */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="border-l border-slate-700 pl-3">
              <span className="text-xs text-slate-400">Dossier ID:</span>{' '}
              <strong className="font-mono text-emerald-400 text-sm">{complaint.trackingId}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              💡 Tip: Enable <strong>&quot;Background graphics&quot;</strong> in print settings for seals & badges
            </span>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE DOSSIER SHEET (Standard A4 Container) */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 print:max-w-none print:w-full bg-white shadow-2xl print:shadow-none border border-slate-300 print:border-none rounded-2xl print:rounded-none overflow-hidden">
        <div className="p-8 sm:p-12 print:p-8 space-y-6 text-slate-900">
          {/* ========================================================= */}
          {/* 1. OFFICIAL INSTITUTIONAL LETTERHEAD */}
          {/* ========================================================= */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              {/* Hospital Emblem */}
              <div className="w-20 h-20 rounded-full border border-slate-300 p-1 flex items-center justify-center shrink-0 bg-white">
                <img
                  src="/bkmch-logo.png"
                  alt="BPKMCH Official Seal"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Institution Identity */}
              <div className="flex-1 text-center space-y-0.5">
                <div className="text-base font-bold text-slate-900 tracking-wide font-serif">
                  बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                  B.P. Koirala Memorial Cancer Hospital
                </h1>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Suggestion, Grievance & Quality Assurance Cell • सुझाव तथा गुनासो व्यवस्थापन शाखा
                </div>
                <div className="text-[11px] text-slate-600">
                  Bharatpur-7, Chitwan, Bagmati Province, Nepal • Tel: 056-597005 / 056-524501 • Email: administration@bpkmch.gov.np
                </div>
              </div>

              {/* QR / Token Stamp */}
              <div className="w-20 h-20 border border-slate-300 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0 bg-slate-50 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Docket</span>
                <span className="font-mono font-black text-xs text-slate-900">{complaint.trackingId}</span>
                <span className="text-[9px] text-slate-400 mt-1 font-mono">PIN: {complaint.pin}</span>
              </div>
            </div>

            {/* Sub-header Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
              <div>
                <strong>Dossier Ref No:</strong>{' '}
                <span className="font-mono text-slate-900 font-bold">BPKMCH/GRC/DOSSIER/{complaint.trackingId}</span>
              </div>
              <div>
                <strong>Date of Report Generation:</strong>{' '}
                <span className="text-slate-900">{new Date().toLocaleString()}</span>
              </div>
              <div>
                <strong>Security Classification:</strong>{' '}
                <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 uppercase">
                  Confidential Hospital Record
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. DOCUMENT TITLE & SUMMARY STATUS BANNER */}
          {/* ========================================================= */}
          <div className="text-center py-2 space-y-1">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide underline underline-offset-4 decoration-emerald-700">
              OFFICIAL SUJHAAB & GRIEVANCE INVESTIGATION REPORT & CASE DOSSIER
            </h2>
            <div className="text-xs text-slate-600 font-medium">
              सुझाव तथा गुनासो छानबिन, सत्यतथ्य विवरण, विभागीय निरूपण तथा कारबाही अभिलेख
            </div>
          </div>

          {/* Quick Status / Priority Metrics Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Case Status</span>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded font-black text-[11px] uppercase ${
                  complaint.status === 'RESOLVED'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : complaint.status === 'ACTION_TAKEN'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                    : complaint.status === 'UNDER_INVESTIGATION'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : complaint.status === 'ESCALATED'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {complaint.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Priority Rating</span>
              <span
                className={`inline-block mt-0.5 font-bold ${
                  complaint.priority === 'CRITICAL'
                    ? 'text-rose-700'
                    : complaint.priority === 'HIGH'
                    ? 'text-amber-700'
                    : 'text-slate-800'
                }`}
              >
                {complaint.priority}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Turnaround Duration</span>
              <span className="font-bold text-slate-900">
                {turnaroundTime ? turnaroundTime : 'Active / Pending'}
              </span>
              {turnaroundTime && (
                <span className={`text-[10px] block font-medium ${isSlaBreached ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isSlaBreached ? '⚠️ Breached SLA' : '✓ Compliant with SLA'}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Filing Mode</span>
              <span className="font-bold text-slate-900">
                {complaint.isAnonymous ? 'Confidential / Anonymous' : 'Identified Patient'}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. SECTION 1: INCIDENT & FILER PARTICULARS */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center gap-1.5">
              <span>SECTION 1: INCIDENT PARTICULARS & COMPLAINANT IDENTIFICATION</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Complainant Info */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-1.5 bg-white">
                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 text-[11px] uppercase text-emerald-800">
                  Complainant / Patient Profile
                </div>
                {complaint.isAnonymous ? (
                  <div className="py-2 text-slate-500 italic text-xs">
                    [CONFIDENTIAL / IDENTITY REDACTED AS PER PATIENT PRIVACY CHARTER 2081]
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-500">Patient Name:</span>{' '}
                      <strong className="text-slate-900">{complaint.patientName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact Phone:</span>{' '}
                      <strong className="text-slate-900 font-mono">{complaint.patientPhone || 'N/A'}</strong>
                    </div>
                    {complaint.patientEmail && (
                      <div>
                        <span className="text-slate-500">Email Address:</span>{' '}
                        <span className="text-slate-800 font-mono">{complaint.patientEmail}</span>
                      </div>
                    )}
                    {complaint.mrnNumber && (
                      <div>
                        <span className="text-slate-500">Hospital File / MRN:</span>{' '}
                        <strong className="text-slate-900 font-mono">{complaint.mrnNumber}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Incident Context */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-1.5 bg-white">
                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 text-[11px] uppercase text-emerald-800">
                  Incident Coordinates & Timing
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Incident Date & Time:</span>{' '}
                    <strong className="text-slate-900">{new Date(complaint.incidentDate).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Lodged in Portal:</span>{' '}
                    <span className="text-slate-800">{new Date(complaint.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Specific Location:</span>{' '}
                    <strong className="text-slate-900">{complaint.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Category:</span>{' '}
                    <span className="font-bold text-slate-800">{complaint.category.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. SECTION 2: SUBJECT PERSONNEL & DEPARTMENT */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              SECTION 2: SUBJECT PERSONNEL & DEPARTMENT UNDER INQUIRY
            </h3>

            <div className="border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
              <div>
                <span className="text-slate-500">Target Department:</span>{' '}
                <strong className="text-slate-900">{complaint.department.nameEn}</strong>{' '}
                <span className="text-slate-500 font-mono">({complaint.department.code})</span>
                {complaint.unit && (
                  <div className="text-slate-600 mt-0.5">
                    Unit / Sub-Division: <strong>{complaint.unit.nameEn} ({complaint.unit.code})</strong>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500">Target Personnel:</span>{' '}
                {complaint.targetPersonName ? (
                  <strong className="text-slate-900">
                    {complaint.targetPersonName}{' '}
                    {complaint.targetPersonRole && `(${complaint.targetPersonRole})`}
                  </strong>
                ) : (
                  <span className="text-slate-500 italic">Not individually named (Departmental Service)</span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. SECTION 3: GRIEVANCE NARRATIVE & SUBSTANCE */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              SECTION 3: GRIEVANCE STATEMENT & COMPLAINANT NARRATIVE
            </h3>

            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                Subject: {complaint.subject}
              </div>

              <div className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                {complaint.description}
              </div>

              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="pt-2 text-[11px] text-slate-600 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    <strong>Supporting Evidence Uploaded:</strong> {complaint.attachments.length} attachment(s) recorded in archive.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. SECTION 4: DEPARTMENT HANDLING & CASE ASSIGNMENT */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              SECTION 4: INVESTIGATION HANDLING & SLA BENCHMARK
            </h3>

            <div className="border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
              <div>
                <span className="text-slate-500 text-[11px] block">Investigating Officer</span>
                {complaint.assignedTo ? (
                  <div>
                    <strong className="text-slate-900">{complaint.assignedTo.name}</strong>
                    <span className="text-slate-500 block text-[10px] capitalize">
                      {complaint.assignedTo.role.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-700 font-semibold italic">Unassigned (Under Central Review)</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">Standard SLA Allocation</span>
                <strong className="text-slate-900">{slaTarget} Hours</strong>
                <span className="text-slate-500 block text-[10px]">Hospital Quality Benchmark</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">Resolution Date & Time</span>
                <strong className="text-slate-900">
                  {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : 'In Progress'}
                </strong>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 7. SECTION 5: CHRONOLOGICAL INVESTIGATION AUDIT TRAIL */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              SECTION 5: CHRONOLOGICAL INVESTIGATION AUDIT TRAIL & LOGS ({complaint.actions?.length || 0})
            </h3>

            {complaint.actions && complaint.actions.length > 0 ? (
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3 w-36">Timestamp</th>
                      <th className="py-2 px-3 w-32">Action Type</th>
                      <th className="py-2 px-3 w-40">Acting Official</th>
                      <th className="py-2 px-3">Investigation Statement / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {complaint.actions.map((act, idx) => (
                      <tr key={act.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 font-mono">
                          {new Date(act.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                            {act.actionType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 text-[11px]">
                          {act.actor ? (
                            <div>
                              <span>{act.actor.name}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {act.actor.role.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">System / Filer</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-800 leading-snug">
                          {act.description}
                          {!act.isPublic && (
                            <span className="ml-2 text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold uppercase">
                              Confidential
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-200 p-4 text-center text-xs text-slate-500 italic rounded-lg">
                No formal investigation logs registered yet.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 8. SECTION 6: DIRECT TWO-WAY PATIENT DIALOGUE & TRANSCRIPT */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>SECTION 6: TWO-WAY PATIENT INQUIRY & DIALOGUE TRANSCRIPT ({complaint.messages?.length || 0})</span>
              <span className="text-[10px] text-slate-500 font-normal">Confidential Inquiry Record</span>
            </h3>

            {complaint.messages && complaint.messages.length > 0 ? (
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3 w-36">Timestamp</th>
                      <th className="py-2 px-3 w-40">Sender Party</th>
                      <th className="py-2 px-3">Message Transcript / Clarification Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {complaint.messages.map((msg, idx) => {
                      const isStaff = msg.senderType === 'STAFF' || msg.senderType === 'ADMIN';
                      return (
                        <tr key={msg.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 text-[11px] text-slate-600 font-mono">
                            {new Date(msg.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded text-[10px] inline-block ${
                                isStaff
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isStaff ? '🏥 ' : '👤 '}
                              {msg.senderName}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-800 leading-snug whitespace-pre-wrap">
                            {msg.message}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-200 p-3 text-center text-xs text-slate-500 italic rounded-lg">
                No direct two-way messages recorded for this case.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 9. SECTION 7: CLINICAL GOVERNANCE, ROOT CAUSE ANALYSIS (RCA) & CAPA */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>SECTION 7: CLINICAL GOVERNANCE, ROOT CAUSE ANALYSIS (RCA) & CAPA AUDIT</span>
              <span className="text-[10px] text-slate-500 font-normal">Quality Improvement Standard</span>
            </h3>

            {complaint.capa ? (
              <div className="border border-slate-300 rounded-xl p-4 bg-blue-50/30 space-y-3 text-xs">
                {/* Header Row: Root Cause Tag & QA Verification Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 text-[11px] uppercase">RCA Category:</span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-indigo-100 text-indigo-900 border border-indigo-200">
                      🏷️ {complaint.capa.rootCauseCategory.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px]">QA Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        complaint.capa.status === 'APPROVED_BY_QA' || complaint.capa.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : complaint.capa.status === 'PENDING_QA_REVIEW'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {complaint.capa.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Root Cause Narrative */}
                <div>
                  <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">
                    1. Root Cause Analysis (Why-Why Diagnostic Finding):
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-sans">
                    {complaint.capa.rootCauseAnalysis}
                  </div>
                </div>

                {/* Corrective Action (Immediate Remedy) */}
                <div>
                  <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">
                    2. Corrective Action Taken (Immediate Complainant Redressal):
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-slate-900 leading-relaxed font-sans">
                    {complaint.capa.correctiveAction}
                  </div>
                </div>

                {/* Preventive Action (Systemic Hospital Protocol) */}
                <div>
                  <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">
                    3. Preventive Action Instituted (Hospital-Wide Systemic Quality Safeguard):
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-slate-900 leading-relaxed font-sans">
                    {complaint.capa.preventiveAction}
                  </div>
                </div>

                {/* QA Verification Meta Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Audited By:</span>
                    <strong>{complaint.capa.qaOfficerName || 'Hospital Quality Committee'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Target Review Date:</span>
                    <strong>
                      {complaint.capa.targetReviewDate
                        ? new Date(complaint.capa.targetReviewDate).toLocaleDateString()
                        : 'Routine Quarterly Audit'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Audit Log Timestamp:</span>
                    <span className="font-mono text-slate-600">
                      {new Date(complaint.capa.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 p-3 text-center text-xs text-slate-500 italic rounded-lg bg-slate-50/50">
                CAPA audit record pending documentation by Quality Improvement Officer.
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 10. SECTION 8: FINAL DETERMINATION & CORRECTIVE ACTIONS */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
              SECTION 8: FINAL REDRESSAL DETERMINATION & PATIENT RESOLUTION
            </h3>

            <div className="border border-slate-300 rounded-xl p-4 bg-emerald-50/40 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">
                  Official Administrative Findings & Corrective Action Summary:
                </span>
                <div className="bg-white p-3 rounded-lg border border-emerald-200 text-slate-900 leading-relaxed font-sans">
                  {complaint.actionSummary ? (
                    complaint.actionSummary
                  ) : (
                    <span className="text-slate-500 italic">
                      Case investigation currently in progress. Final corrective action summary will be documented upon committee closure.
                    </span>
                  )}
                </div>
              </div>

              {/* Patient CSAT Feedback if available */}
              {complaint.feedback && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Patient Satisfaction Rating</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= complaint.feedback!.rating
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-bold text-slate-800">
                        {complaint.feedback.rating} / 5 Stars
                      </span>
                    </div>
                    {complaint.feedback.comments && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        &quot;{complaint.feedback.comments}&quot;
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Recorded: {new Date(complaint.feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 11. SECTION 9: OFFICIAL COMMITTEE SIGN-OFF & ATTESTATION */}
          {/* ========================================================= */}
          <div className="pt-4 space-y-4 break-inside-avoid">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-900 pb-1">
              SECTION 9: OFFICIAL COMMITTEE ATTESTATION & SIGN-OFF
            </h3>

            <p className="text-[10px] text-slate-500 leading-normal italic">
              We, the undersigned officials of B.P. Koirala Memorial Cancer Hospital, hereby attest that this grievance
              investigation has been conducted in accordance with hospital governance directives, medical ethics, and quality
              assurance regulations. All findings and corrective measures documented herein have been duly verified.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 text-center text-xs">
              {/* Box 1: Investigating Officer */}
              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-slate-900 pb-1">
                  <div className="h-10" /> {/* Space for physical signature */}
                  <div className="font-bold text-slate-900 text-[11px]">
                    {complaint.assignedTo ? complaint.assignedTo.name : '_______________________'}
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-700">Investigating Officer</div>
                <div className="text-[9px] text-slate-500">Date: ____/____/2026</div>
              </div>

              {/* Box 2: Head of Department */}
              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-slate-900 pb-1">
                  <div className="h-10" />
                  <div className="font-bold text-slate-900 text-[11px]">
                    _______________________
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-700">Head of Department</div>
                <div className="text-[9px] text-slate-500">Date: ____/____/2026</div>
              </div>

              {/* Box 3: Grievance Redressal Committee */}
              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-slate-900 pb-1">
                  <div className="h-10" />
                  <div className="font-bold text-slate-900 text-[11px]">
                    Grievance Officer
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-700">Member Secretary (GRC)</div>
                <div className="text-[9px] text-slate-500">Seal & Date</div>
              </div>

              {/* Box 4: Executive Director */}
              <div className="flex flex-col justify-end space-y-1">
                <div className="border-b border-slate-900 pb-1">
                  <div className="h-10" />
                  <div className="font-bold text-slate-900 text-[11px]">
                    Executive Director
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-slate-700">Hospital Director / MS</div>
                <div className="text-[9px] text-slate-500">Approved & Countersigned</div>
              </div>
            </div>

            {/* Official Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between text-[9px] text-slate-400">
              <div>
                BPKMCH Sujhaab & Grievance Management System (Sujhaab Portal) • Confidential Internal Docket
              </div>
              <div>
                Page 1 of 1 • System Verification Stamp: BPKMCH-VERIFIED-{complaint.trackingId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
