'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  LogOut,
  Plus,
  ChevronRight,
  User,
  Phone,
  MessageSquare,
  Star,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showToast,
} from '@/lib/alerts';


interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface ActionLog {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  trackingId: string;
  pin: string;
  isAnonymous: boolean;
  patientPhone: string | null;
  patientName: string | null;
  category: string;
  department: { nameEn: string; nameNp: string; code: string };
  unit?: { nameEn: string; nameNp: string; code: string } | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  incidentDate: string;
  location: string;
  targetPersonName: string | null;
  targetPersonRole: string | null;
  actionSummary: string | null;
  resolvedAt: string | null;
  createdAt: string;
  actions: ActionLog[];
  feedback: { rating: number; comments: string | null } | null;
}

export default function PatientDashboardPage() {
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPhoneInput, setSearchPhoneInput] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');

  // Feedback State for inline rating
  const [ratingInput, setRatingInput] = useState<{ [id: string]: number }>({});
  const [commentInput, setCommentInput] = useState<{ [id: string]: string }>({});
  const [submittingRating, setSubmittingRating] = useState<{ [id: string]: boolean }>({});

  const fetchPatientData = async (phoneQuery?: string) => {
    try {
      setSearching(true);
      let url = '/api/patient/complaints';
      const params = new URLSearchParams();
      if (phoneQuery) params.set('phone', phoneQuery);
      if (activeStatusFilter !== 'ALL') params.set('status', activeStatusFilter);
      if (searchTerm.trim()) params.set('query', searchTerm.trim());

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (!phoneQuery) {
          router.push('/patient/login');
          return;
        }
      }

      if (data.patient && !patient) {
        setPatient(data.patient);
      }
      setComplaints(data.complaints || []);
    } catch (err) {
      if (!phoneQuery) router.push('/patient/login');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [activeStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatientData(searchPhoneInput.trim() || undefined);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setSearchPhoneInput('');
    setActiveStatusFilter('ALL');
    fetchPatientData();
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmDialog(
      'Sign Out / लगआउट?',
      'Are you sure you want to sign out from the patient portal?',
      'Yes, Sign Out / लगआउट गर्नुहोस्',
      'Cancel / रद्द गर्नुहोस्'
    );
    if (!confirmed) return;

    await fetch('/api/patient/logout', { method: 'POST' });
    router.push('/patient/login');
  };

  const handleInlineFeedbackSubmit = async (complaintId: string) => {
    const stars = ratingInput[complaintId] || 5;
    const comments = commentInput[complaintId] || '';

    setSubmittingRating((prev) => ({ ...prev, [complaintId]: true }));
    try {
      const res = await fetch('/api/complaints/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId,
          rating: stars,
          comments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      await showSuccessAlert(
        'धन्यवाद! Thank You',
        'तपाईंको प्रतिक्रिया र मूल्याङ्कन सफलतापूर्वक दर्ता भयो। (Your feedback and rating have been recorded.)'
      );

      // Refresh list
      fetchPatientData(searchPhoneInput.trim() || undefined);
    } catch (err: any) {
      await showErrorAlert('प्रतिक्रिया त्रुटि / Error', err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingRating((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // Helper for Stepper indices
  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 1;
      case 'UNDER_INVESTIGATION':
      case 'IN_REVIEW':
        return 2;
      case 'ACTION_TAKEN':
        return 3;
      case 'RESOLVED':
        return 4;
      default:
        return 1;
    }
  };

  // Metric counts
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_INVESTIGATION' || c.status === 'IN_REVIEW'
  ).length;
  const actionCount = complaints.filter((c) => c.status === 'ACTION_TAKEN').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-slate-500 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#27548b]" />
          <span>Loading patient grievance dashboard...</span>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* DASHBOARD HERO BANNER */}
      <div className="bg-[#27548b] text-white border-b border-blue-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white text-[#27548b] rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Welcome, {patient?.name || 'Patient'}
                </h1>
                <span className="bg-blue-900/80 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {patient?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mobile: <strong>{patient.phone}</strong></span>
                  </span>
                )}
                {patient?.email && <span>✉️ Email: {patient.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/complaint/new"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge New Grievance</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* TOP SUMMARY STATS METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#27548b] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Total Grievances
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-600">{pendingCount}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Under Investigation
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-600">{actionCount}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Action Initiated
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600">{resolvedCount}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Resolved
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#27548b]" />
                <span>Search Complaints Status / उजुरी स्थिति खोज्नुहोस्</span>
              </h2>
              <p className="text-xs text-slate-500">
                Search complaints by <strong>Mobile Number</strong>, <strong>Tracking ID</strong>, or keyword.
              </p>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Submitted', value: 'SUBMITTED' },
                { label: 'Under Investigation', value: 'UNDER_INVESTIGATION' },
                { label: 'Action Taken', value: 'ACTION_TAKEN' },
                { label: 'Resolved', value: 'RESOLVED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeStatusFilter === tab.value
                      ? 'bg-[#27548b] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Inputs Form */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <div className="md:col-span-5 relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                placeholder="Search by Mobile Number (e.g. 9821804978)..."
                value={searchPhoneInput}
                onChange={(e) => setSearchPhoneInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#27548b] focus:bg-white"
              />
            </div>

            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by Tracking ID (GN-...) or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#27548b] focus:bg-white"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={searching}
                className="flex-1 px-4 py-2.5 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>

              {(searchTerm || searchPhoneInput || activeStatusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* COMPLAINTS CARDS LIST */}
        {complaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-[#27548b] rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Grievances Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchPhoneInput || searchTerm
                  ? `No complaints matched your search filter for "${searchPhoneInput || searchTerm}". Try clearing search or entering a different phone number.`
                  : "You haven't submitted any complaints under this account yet. Click below to lodge a grievance."}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {(searchPhoneInput || searchTerm) && (
                <button
                  onClick={handleResetSearch}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/complaint/new"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Lodge a Complaint Now</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {complaints.map((c) => {
              const currentStep = getStatusStepIndex(c.status);

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5"
                >
                  {/* CARD HEADER: Token, PIN, Phone, and Current Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-extrabold text-base text-[#27548b] bg-blue-50 px-3.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1.5 shadow-sm">
                        <FileText className="w-4 h-4 text-[#27548b]" />
                        <span>{c.trackingId}</span>
                      </span>

                      <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                        PIN: <strong className="text-slate-800">{c.pin}</strong>
                      </span>

                      {c.patientPhone && (
                        <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Mobile: <strong>{c.patientPhone}</strong></span>
                        </span>
                      )}

                      <span className="text-xs text-slate-500 font-medium">
                        Lodged: {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Live Status:</span>
                      <span
                        className={`px-3.5 py-1 rounded-full font-extrabold text-xs uppercase tracking-wider ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : c.status === 'ACTION_TAKEN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : c.status === 'UNDER_INVESTIGATION' || c.status === 'IN_REVIEW'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : c.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* VISUAL STATUS STEPPER BAR */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Status Resolution Progress (प्रगति स्थिति):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { step: 1, label: '1. Registered (दर्ता)', desc: 'Grievance logged' },
                        { step: 2, label: '2. Under Investigation (छानबिन)', desc: 'Committee assigned' },
                        { step: 3, label: '3. Action Initiated (कारबाही)', desc: 'Corrective action' },
                        { step: 4, label: '4. Resolved (समाधान)', desc: 'Official report' },
                      ].map((s) => {
                        const isDone = s.step <= currentStep;
                        const isCurrent = s.step === currentStep;

                        return (
                          <div
                            key={s.step}
                            className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                              isDone
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 mt-0.5" />
                            )}
                            <div className="leading-tight">
                              <div className="text-xs">{s.label}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{s.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* COMPLAINT DETAILS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    <div className="md:col-span-8 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{c.subject}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#27548b]" />
                            <span>Dept: <strong>{c.department.nameEn}</strong></span>
                          </span>
                          {c.unit && (
                            <span className="flex items-center gap-1 text-[#27548b]">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Unit: <strong>{c.unit.nameEn}</strong></span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Incident: {new Date(c.incidentDate).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                        {c.description}
                      </div>

                      {/* OFFICIAL RESOLUTION SUMMARY (IF AVAILABLE) */}
                      {c.actionSummary && (
                        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-xs text-emerald-950 font-medium space-y-1.5 shadow-sm">
                          <div className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Official Hospital Action Taken Report / कारबाही रिपोर्ट:</span>
                          </div>
                          <p className="leading-relaxed bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                            {c.actionSummary}
                          </p>
                          {c.resolvedAt && (
                            <div className="text-[11px] text-emerald-700">
                              Resolved on: {new Date(c.resolvedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* LATEST ACTION AUDIT LOGS */}
                      {c.actions && c.actions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                            Recent Investigation Activity:
                          </div>
                          <div className="space-y-1 text-xs">
                            {c.actions.slice(0, 2).map((act) => (
                              <div
                                key={act.id}
                                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between text-slate-700"
                              >
                                <span>• {act.description}</span>
                                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                  {new Date(act.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS & FEEDBACK COLUMN */}
                    <div className="md:col-span-4 flex flex-col items-stretch justify-start space-y-4 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
                      <Link
                        href={`/track?trackingId=${c.trackingId}&pin=${c.pin}`}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>View Full Live Timeline</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* INLINE FEEDBACK FORM IF RESOLVED */}
                      {(c.status === 'RESOLVED' || c.status === 'ACTION_TAKEN') && (
                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>Resolution Rating</span>
                          </div>

                          {c.feedback ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < (c.feedback?.rating || 0)
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-slate-700 font-bold ml-1">
                                  ({c.feedback.rating}/5)
                                </span>
                              </div>
                              {c.feedback.comments && (
                                <p className="text-[11px] text-slate-600 italic">
                                  "{c.feedback.comments}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[11px] text-slate-600">
                                How satisfied are you with the resolution?
                              </p>
                              <div className="flex items-center gap-1 text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setRatingInput((prev) => ({ ...prev, [c.id]: star }))
                                    }
                                    className="p-1 hover:scale-110 transition-transform"
                                  >
                                    <Star
                                      className={`w-5 h-5 ${
                                        star <= (ratingInput[c.id] || 5)
                                          ? 'fill-amber-400 text-amber-500'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Optional remarks..."
                                value={commentInput[c.id] || ''}
                                onChange={(e) =>
                                  setCommentInput((prev) => ({
                                    ...prev,
                                    [c.id]: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                disabled={submittingRating[c.id]}
                                onClick={() => handleInlineFeedbackSubmit(c.id)}
                                className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                              >
                                {submittingRating[c.id] ? 'Saving...' : 'Submit Rating'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
