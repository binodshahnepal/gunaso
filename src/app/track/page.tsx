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
} from 'lucide-react';

interface ActionLog {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  trackingId: string;
  isAnonymous: boolean;
  patientName: string | null;
  category: string;
  department: {
    nameEn: string;
    nameNp: string;
    code: string;
    slaHours: number;
  };
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

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchComplaintStatus = async (id: string, pin: string, phone: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setComplaint(null);

    try {
      let url = `/api/complaints/track?trackingId=${encodeURIComponent(id.trim())}`;
      if (pin.trim()) url += `&pin=${encodeURIComponent(pin.trim())}`;
      if (phone.trim()) url += `&phone=${encodeURIComponent(phone.trim())}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Complaint not found');
      }

      setComplaint(data.complaint);
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
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 1;
      case 'UNDER_INVESTIGATION':
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
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Track Complaint Status / स्थिति हेर्नुहोस्
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Enter your 10-character Tracking ID (e.g. GN-2026-8942) and PIN or Mobile number.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tracking ID *
              </label>
              <input
                type="text"
                placeholder="e.g. GN-2026-8942"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4-Digit Security PIN
              </label>
              <input
                type="text"
                placeholder="e.g. 1234"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (If identified)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9841234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Search Status / खोज्नुहोस्'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* COMPLAINT DETAILS & TIMELINE VIEW */}
      {complaint && (
        <div className="space-y-6">
          {/* HEADER STATUS BADGE CARD */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-emerald-400 font-mono uppercase font-bold tracking-wider">
                  Grievance Record
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-wider font-mono">
                  {complaint.trackingId}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Status:</span>
                <span className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide">
                  {complaint.status}
                </span>
              </div>
            </div>

            {/* VISUAL STEPPER TIMELINE */}
            <div className="space-y-3 pt-2">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Progress Timeline (प्रगति स्थिति):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { step: 1, label: '1. Submitted', code: 'SUBMITTED' },
                  { step: 2, label: '2. Under Investigation', code: 'UNDER_INVESTIGATION' },
                  { step: 3, label: '3. Action Initiated', code: 'ACTION_TAKEN' },
                  { step: 4, label: '4. Resolved', code: 'RESOLVED' },
                ].map((s) => {
                  const currentStep = getStatusStepIndex(complaint.status);
                  const isDone = s.step <= currentStep;
                  const isCurrent = s.step === currentStep;

                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        isDone
                          ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
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
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-3">
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
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
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
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
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
                        <span className="font-bold text-emerald-700 uppercase">{act.actionType}</span>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
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
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-6"
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
