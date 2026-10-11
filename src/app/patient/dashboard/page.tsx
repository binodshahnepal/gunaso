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
} from 'lucide-react';

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

  const fetchPatientData = async () => {
    try {
      const res = await fetch('/api/patient/complaints');
      const data = await res.json();

      if (!res.ok || !data.success) {
        router.push('/patient/login');
        return;
      }

      setPatient(data.patient);
      setComplaints(data.complaints);
    } catch (err) {
      router.push('/patient/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/patient/logout', { method: 'POST' });
    router.push('/patient/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-slate-500">
          Loading your patient dashboard...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* DASHBOARD HEADER BANNER */}
      <div className="bg-[#27548b] text-white border-b border-blue-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white text-[#27548b] rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Welcome, {patient?.name}
                </h1>
                <span className="bg-blue-900/80 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-3 mt-0.5">
                {patient?.phone && <span>📱 Mobile: {patient.phone}</span>}
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
        {/* COUNTER METRICS CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              My Lodged Grievances / मेरा उजुरीहरू
            </h2>
            <p className="text-xs text-slate-500">
              Below is the list of all grievances filed under your mobile number ({patient?.phone || patient?.email}).
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-[#27548b]">{complaints.length}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Complaints</div>
          </div>
        </div>

        {/* COMPLAINTS CARDS LIST */}
        {complaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-[#27548b] rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Grievances Lodged Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't submitted any complaints under this account yet. Click below to lodge a grievance against any department.
              </p>
            </div>
            <Link
              href="/complaint/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge a Complaint Now</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* CARD HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-base text-[#27548b] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      {c.trackingId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">PIN: {c.pin}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider ${
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
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base">{c.subject}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        🏢 Department: <span className="font-semibold text-slate-800">{c.department.nameEn}</span>
                      </div>
                      {c.unit && (
                        <div>
                          📍 Unit: <span className="font-semibold text-[#27548b]">{c.unit.nameEn}</span>
                        </div>
                      )}
                      <div>
                        📅 Date: <span className="font-medium">{new Date(c.incidentDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 max-h-20 overflow-y-auto">
                      {c.description}
                    </div>

                    {/* OFFICIAL RESOLUTION SUMMARY PREVIEW */}
                    {c.actionSummary && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 font-medium space-y-1">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Official Hospital Action Report:</span>
                        </div>
                        <p>{c.actionSummary}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 flex flex-col items-end justify-center space-y-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link
                      href={`/track?trackingId=${c.trackingId}&pin=${c.pin}`}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Track Full Live Timeline</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    {c.feedback && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span>Feedback Given:</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: c.feedback.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
