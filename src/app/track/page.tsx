'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  MapPin,
  User,
  Star,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Phone,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';


interface ActionLog {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  trackingId: string;
  pin?: string;
  isAnonymous: boolean;
  patientName: string | null;
  patientPhone?: string | null;
  category: string;
  department: {
    nameEn: string;
    nameNp: string;
    code: string;
    slaHours: number;
  };
  unit?: {
    nameEn: string;
    nameNp: string;
    code: string;
  } | null;
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
  updatedAt: string;
  actions: ActionLog[];
  feedback: {
    rating: number;
    comments: string | null;
  } | null;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const queryTrackingId = searchParams.get('trackingId') || '';
  const queryPin = searchParams.get('pin') || '';

  const [trackingIdInput, setTrackingIdInput] = useState(queryTrackingId);
  const [pinInput, setPinInput] = useState(queryPin);
  const [phoneInput, setPhoneInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [complaintList, setComplaintList] = useState<Complaint[]>([]);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchComplaintStatus = async (id: string, pin: string, phone: string) => {
    if (!id.trim() && !phone.trim()) {
      setErrorMsg('Please enter either a Tracking ID or a Mobile Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setComplaint(null);
    setComplaintList([]);

    try {
      let url = '/api/complaints/track?';
      const params = new URLSearchParams();
      if (id.trim()) params.set('trackingId', id.trim());
      if (pin.trim()) params.set('pin', pin.trim());
      if (phone.trim()) params.set('phone', phone.trim());

      url += params.toString();

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Complaint not found');
      }

      if (data.isMulti && data.complaints) {
        setComplaintList(data.complaints);
      } else if (data.complaint) {
        setComplaint(data.complaint);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryTrackingId) {
      fetchComplaintStatus(queryTrackingId, queryPin, '');
    }
  }, [queryTrackingId, queryPin]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaintStatus(trackingIdInput, pinInput, phoneInput);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setSubmittingFeedback(true);

    try {
      const res = await fetch('/api/complaints/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaint.id,
          rating,
          comments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setFeedbackSuccess(true);
      await showSuccessAlert(
        'धन्यवाद! Thank You',
        'तपाईंको प्रतिक्रिया र मूल्याङ्कन सफलतापूर्वक दर्ता भयो। (Your feedback and rating have been recorded successfully.)'
      );
    } catch (err: any) {
      await showErrorAlert('प्रतिक्रिया त्रुटि / Error', err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

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

  return (
    <div className="space-y-8">
      {/* SEARCH BOX */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Track Grievance Status / उजुरी स्थिति खोज्नुहोस्
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Search by <strong>Tracking ID</strong> (e.g. GN-2026-8942) or by your <strong>Mobile Number</strong> (e.g. 9821804978).
            </p>
          </div>
          <div className="w-14 h-14 bg-white rounded-full p-0.5 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
            <img
              src="/bkmch-logo.png"
              alt="BPKMCH Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (मोबाइल नम्बर)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="e.g. 9821804978"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#27548b]"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tracking ID (टोकन नम्बर)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. GN-2026-8942"
                  value={trackingIdInput}
                  onChange={(e) => setTrackingIdInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-[#27548b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security PIN (PIN नम्बर - Optional)
              </label>
              <input
                type="text"
                placeholder="4-digit PIN (if known)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#27548b]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{loading ? 'Searching...' : 'Search Status / स्थिति खोज्नुहोस्'}</span>
            </button>

            {(trackingIdInput || pinInput || phoneInput || complaint || complaintList.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setTrackingIdInput('');
                  setPinInput('');
                  setPhoneInput('');
                  setComplaint(null);
                  setComplaintList([]);
                  setErrorMsg('');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* MULTIPLE COMPLAINTS RESULTS LIST (When searching by Mobile Number) */}
      {complaintList.length > 0 && !complaint && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Found {complaintList.length} Grievance(s) for Phone: {phoneInput}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Click on any grievance below to inspect its complete live status timeline and action report.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {complaintList.map((item) => (
              <div
                key={item.id}
                onClick={() => setComplaint(item)}
                className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-[#27548b] rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-[#27548b] bg-white px-2.5 py-0.5 rounded border border-blue-200">
                      {item.trackingId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        item.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'ACTION_TAKEN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.subject}</h4>
                  <p className="text-xs text-slate-500">
                    🏢 {item.department.nameEn} • 📅 {new Date(item.incidentDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#27548b] shrink-0">
                  <span>View Timeline</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SINGLE COMPLAINT DETAILS & TIMELINE VIEW */}
      {complaint && (
        <div className="space-y-6">
          {complaintList.length > 0 && (
            <button
              onClick={() => setComplaint(null)}
              className="text-xs font-bold text-[#27548b] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all {complaintList.length} complaints for {phoneInput}</span>
            </button>
          )}

          {/* HEADER STATUS BADGE CARD */}
          <div className="bg-[#1a385c] text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/60 pb-4">
              <div>
                <span className="text-xs text-amber-300 font-mono uppercase font-bold tracking-wider">
                  BPKMCH Grievance Record
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-wider font-mono">
                  {complaint.trackingId}
                </h2>
                {complaint.pin && (
                  <span className="text-xs text-blue-200 font-mono mt-1 block">PIN: {complaint.pin}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-200">Current Status:</span>
                <span
                  className={`px-3.5 py-1 rounded-full font-bold text-xs uppercase tracking-wide ${
                    complaint.status === 'RESOLVED'
                      ? 'bg-emerald-400 text-slate-950 font-extrabold'
                      : 'bg-amber-400 text-slate-950 font-extrabold'
                  }`}
                >
                  {complaint.status}
                </span>
              </div>
            </div>

            {/* VISUAL STEPPER TIMELINE */}
            <div className="space-y-3 pt-2">
              <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
                Progress Timeline (प्रगति स्थिति):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { step: 1, label: '1. Submitted (दर्ता)', code: 'SUBMITTED' },
                  { step: 2, label: '2. Under Investigation (छानबिन)', code: 'UNDER_INVESTIGATION' },
                  { step: 3, label: '3. Action Initiated (कारबाही)', code: 'ACTION_TAKEN' },
                  { step: 4, label: '4. Resolved (समाधान)', code: 'RESOLVED' },
                ].map((s) => {
                  const currentStep = getStatusStepIndex(complaint.status);
                  const isDone = s.step <= currentStep;

                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        isDone
                          ? 'bg-blue-950 border-blue-400 text-amber-300 font-bold'
                          : 'bg-slate-900/60 border-blue-950 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* OFFICIAL ACTION REPORT (IF AVAILABLE) */}
          {complaint.actionSummary && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Official Hospital Resolution Summary / कारबाही रिपोर्ट</span>
              </div>
              <p className="text-sm text-emerald-950 leading-relaxed font-medium bg-white p-4 rounded-xl border border-emerald-200">
                {complaint.actionSummary}
              </p>
              {complaint.resolvedAt && (
                <div className="text-xs text-emerald-700 font-medium">
                  Resolved Date: {new Date(complaint.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* GRIEVANCE SPECIFICATIONS & AUDIT LOGS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Details */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
                Grievance Particulars / विवरण
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Subject:</span>
                  <span className="font-bold text-slate-900">{complaint.subject}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Department:</span>
                  <span className="font-semibold text-slate-800">{complaint.department.nameEn} ({complaint.department.nameNp})</span>
                </div>

                {complaint.unit && (
                  <div>
                    <span className="text-xs text-slate-500 block">Unit:</span>
                    <span className="font-semibold text-[#27548b]">{complaint.unit.nameEn}</span>
                  </div>
                )}

                {complaint.targetPersonName && (
                  <div>
                    <span className="text-xs text-slate-500 block">Target Person:</span>
                    <span className="font-medium text-slate-800">{complaint.targetPersonName} ({complaint.targetPersonRole || 'Staff'})</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Location:</span>
                    <span className="font-medium text-slate-800">{complaint.location}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Incident Date:</span>
                    <span className="font-medium text-slate-800">{new Date(complaint.incidentDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Full Description:</span>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {complaint.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: History Audit Trail */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
                Activity Audit Trail (कार्य प्रगति)
              </h3>

              <div className="space-y-3">
                {complaint.actions.length === 0 ? (
                  <p className="text-xs text-slate-400">No public logs recorded yet.</p>
                ) : (
                  complaint.actions.map((act) => (
                    <div key={act.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-[#27548b] uppercase">{act.actionType}</span>
                        <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* PATIENT FEEDBACK FORM (IF RESOLVED OR ACTION TAKEN) */}
          {(complaint.status === 'RESOLVED' || complaint.status === 'ACTION_TAKEN') && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Rate Resolution Satisfaction / प्रतिक्रिया दिनुहोस्</span>
              </h3>

              {complaint.feedback || feedbackSuccess ? (
                <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-xs font-semibold">
                  ✓ Thank you! Feedback recorded with rating: {complaint.feedback?.rating || rating} / 5 Stars.
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Satisfaction Rating (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-2 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-8 h-8 ${s <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Additional Comments / प्रतिक्रिया (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Was the resolution satisfactory? Leave your comments..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#27548b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-6 py-2.5 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#27548b] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home / गृहपृष्ठ
        </Link>

        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading tracking portal...</div>}>
          <TrackContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
