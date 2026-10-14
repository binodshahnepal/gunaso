'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  EyeOff,
  UserCheck,
  Building2,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Printer,
  Copy,
  MessageSquare,
  ArrowLeft,
  Upload,
  User,
  Check,
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showToast } from '@/lib/alerts';


interface Unit {
  id: string;
  code: string;
  nameEn: string;
  nameNp: string;
}

interface Department {
  id: string;
  code: string;
  nameEn: string;
  nameNp: string;
  slaHours: number;
  units: Unit[];
}

export default function LodgeComplaintPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Logged In Patient Session State
  const [loggedInPatient, setLoggedInPatient] = useState<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null>(null);

  // Form State
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState('MEDICAL_CARE');
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [targetPersonName, setTargetPersonName] = useState('');
  const [targetPersonRole, setTargetPersonRole] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    setIncidentDate(new Date().toISOString().slice(0, 16));
  }, []);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  // Identified mode contact details
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [mrnNumber, setMrnNumber] = useState('');

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{
    trackingId: string;
    pin: string;
    departmentName: string;
    unitName?: string | null;
    createdAt: string;
  } | null>(null);

  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    async function initData() {
      // 1. Check Patient Session
      try {
        const meRes = await fetch('/api/patient/me');
        const meData = await meRes.json();
        if (meData.success && meData.patient) {
          setLoggedInPatient(meData.patient);
          setPatientName(meData.patient.name || '');
          setPatientPhone(meData.patient.phone || '');
          setPatientEmail(meData.patient.email || '');
        }
      } catch (e) {
        // ignore
      }

      // 2. Fetch Departments
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success && data.departments.length > 0) {
          setDepartments(data.departments);
          const firstDept = data.departments[0];
          setDepartmentId(firstDept.id);
          setAvailableUnits(firstDept.units || []);
          if (firstDept.units && firstDept.units.length > 0) {
            setUnitId(firstDept.units[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      } finally {
        setLoadingDepts(false);
      }
    }
    initData();
  }, []);

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const selectedDept = departments.find((d) => d.id === newDeptId);
    if (selectedDept && selectedDept.units && selectedDept.units.length > 0) {
      setAvailableUnits(selectedDept.units);
      setUnitId(selectedDept.units[0].id);
    } else {
      setAvailableUnits([]);
      setUnitId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!departmentId) {
      setErrorMsg('Please select a target hospital department');
      return;
    }

    if (!location.trim() || !subject.trim() || !description.trim()) {
      setErrorMsg('Please fill in location, subject, and description');
      return;
    }

    if (!isAnonymous && !patientPhone.trim()) {
      setErrorMsg('Contact mobile/WhatsApp number is required for Identified Mode');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/complaints/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAnonymous,
          patientName: isAnonymous ? '' : patientName,
          patientPhone: isAnonymous ? '' : patientPhone,
          patientEmail: isAnonymous ? '' : patientEmail,
          mrnNumber: isAnonymous ? '' : mrnNumber,
          category,
          departmentId,
          unitId: unitId || null,
          targetPersonName,
          targetPersonRole,
          incidentDate,
          location,
          subject,
          description,
          priority,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit complaint');
      }

      setSuccessData(data.data);
      showToast('Grievance lodged successfully!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting.');
      showErrorAlert('Submission Failed / उजुरी दर्ता हुन सकेन', err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!successData) return;
    navigator.clipboard.writeText(
      `Tracking ID: ${successData.trackingId}\nPIN: ${successData.pin}\nLink: ${window.location.origin}/track?trackingId=${successData.trackingId}&pin=${successData.pin}`
    );
    setCopiedToken(true);
    showToast('Tracking credentials copied to clipboard!', 'success');
    setTimeout(() => setCopiedToken(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#27548b] hover:text-blue-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home / गृहपृष्ठमा फर्कनुहोस्
        </Link>

        {/* SUCCESS RECEIPT MODAL */}
        {successData ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Grievance Lodged Successfully!
              </h1>
              <p className="text-sm text-slate-600">
                तपाईंको उजुरी सफलतापूर्वक दर्ता भयो। छानबिन प्रक्रिया सुरु गरिएको छ।
              </p>
            </div>

            {/* RECEIPT BOX */}
            <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 font-mono relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-32 h-32 text-amber-300" />
              </div>

              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                  Official Tracking Receipt
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(successData.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Unique Tracking ID:</div>
                  <div className="text-2xl font-extrabold text-[#27548b] bg-blue-50 px-3 py-1 rounded inline-block text-[#27548b]">
                    {successData.trackingId}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Security PIN:</div>
                  <div className="text-2xl font-extrabold text-amber-400 tracking-wider">
                    {successData.pin}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-xs text-slate-300 space-y-1">
                <div>• Target Department: <span className="text-white font-semibold">{successData.departmentName}</span></div>
                {successData.unitName && (
                  <div>• Hospital Unit: <span className="text-blue-300 font-semibold">{successData.unitName}</span></div>
                )}
                <div>• Mode: <span className="text-amber-300 font-semibold">{isAnonymous ? 'ANONYMOUS (गोप्य)' : 'IDENTIFIED (सम्पर्क विवरणसहित)'}</span></div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 bg-[#27548b] hover:bg-blue-800 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiedToken ? 'Copied to Clipboard!' : 'Copy Tracking Token & PIN'}
              </button>

              <Link
                href={`/track?trackingId=${successData.trackingId}&pin=${successData.pin}`}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <ShieldCheck className="w-4 h-4" />
                Track Status Now →
              </Link>
            </div>
          </div>
        ) : (
          /* MAIN COMPLAINT FORM */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#27548b] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/10 text-blue-100 text-xs px-2.5 py-1 rounded-full font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Patient Sujhaab & Grievance Form / सुझाव तथा उजुरी फारम</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Submit Hospital Sujhaab / Complaint</h1>
                <p className="text-xs sm:text-sm text-blue-100">
                  Please select department and unit to help our Sujhaab & Grievance committee review, investigate, and address your issue.
                </p>
              </div>
              <div className="hidden sm:flex w-16 h-16 bg-white rounded-full p-1 shadow-md shrink-0 items-center justify-center">
                <img
                  src="/bkmch-logo.png"
                  alt="BPKMCH Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: PRIVACY MODE TOGGLE */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-900">
                  Step 1: Select Submission Privacy Mode / गोपनीयता चयन गर्नुहोस्
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      !isAnonymous
                        ? 'border-[#27548b] bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <UserCheck className={`w-5 h-5 shrink-0 mt-0.5 ${!isAnonymous ? 'text-[#27548b]' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Identified Mode (Recommended)</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Contact info will be linked for direct updates & status tracking.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isAnonymous
                        ? 'border-[#27548b] bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <EyeOff className={`w-5 h-5 shrink-0 mt-0.5 ${isAnonymous ? 'text-[#27548b]' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-sm text-slate-900">Anonymous Mode (पूर्ण रूपमा गोप्य)</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Your identity remains 100% hidden. You will get a Tracking ID & PIN.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 2: CATEGORY, DEPARTMENT & UNIT */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-bold text-slate-900">
                  Step 2: Department, Unit & Category / उजुरीको विधा, विभाग तथा एकाइ (Unit)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Grievance Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="MEDICAL_CARE">🩺 Medical Care & Treatment</option>
                      <option value="STAFF_BEHAVIOR">👥 Staff Behavior & Conduct</option>
                      <option value="BILLING">💳 Billing, Cashier & Finance</option>
                      <option value="HYGIENE">🧹 Hygiene & Sanitation</option>
                      <option value="FACILITIES">🏢 Infrastructure & Amenities</option>
                      <option value="DELAY_IN_SERVICE">⏳ Delay in Service</option>
                      <option value="PHARMACY">💊 Pharmacy & Medication</option>
                      <option value="OTHER">❓ Other Issues</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Department (विभाग) *
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={loadingDepts}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameEn} ({d.nameNp})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specific Hospital Unit (एकाइ)
                    </label>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      disabled={availableUnits.length === 0}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium disabled:opacity-50"
                    >
                      {availableUnits.length === 0 ? (
                        <option value="">General Department</option>
                      ) : (
                        availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nameEn} ({u.nameNp})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 3: TARGET PERSON DETAILS (OPTIONAL) */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-900">
                    Step 3: Target Staff Member (Optional) / सम्बन्धित कर्मचारी
                  </label>
                  <span className="text-xs text-slate-500">If applicable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff / Person Name (नाम)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Karki / Cashier Duty Staff"
                      value={targetPersonName}
                      onChange={(e) => setTargetPersonName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff Role / Designation (पद)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Staff Nurse / Receptionist / Security"
                      value={targetPersonRole}
                      onChange={(e) => setTargetPersonRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 4: INCIDENT DETAILS */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-bold text-slate-900">
                  Step 4: Incident Location & Details / घट्नाको विवरण
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Incident Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specific Location / Ward / Room *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. OPD Room 4 / 2nd Floor Washroom / Emergency Bed 3"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Complaint Subject / Summary *
                  </label>
                  <input
                    type="text"
                    placeholder="Short 1-line title (e.g. Unreasonable delay at OPD counter)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Narrative / विस्तृत विवरण *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what happened in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* STEP 5: CONTACT INFORMATION */}
              {!isAnonymous && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-900">
                    Step 5: Patient / Submitter Contact Info / सम्पर्क विवरण
                  </label>

                  {/* IF LOGGED IN PATIENT: SHOW PRE-FILLED CONFIRMATION BANNER */}
                  {loggedInPatient ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-[#27548b] font-bold text-sm">
                          <div className="w-8 h-8 rounded-full bg-[#27548b] text-white flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                          <span>Signed-in Account Detected: {loggedInPatient.name}</span>
                        </div>
                        <span className="text-[11px] bg-blue-100 text-[#27548b] font-bold px-2.5 py-0.5 rounded-full border border-blue-300">
                          Auto-Linked
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-blue-100">
                        <div>📱 Mobile Number: <span className="font-bold text-slate-900">{loggedInPatient.phone || 'N/A'}</span></div>
                        <div>✉️ Email: <span className="font-bold text-slate-900">{loggedInPatient.email || 'N/A'}</span></div>
                      </div>

                      <p className="text-[11px] text-blue-900/80">
                        ✓ Your grievance will automatically be registered under your account so you can track its status anytime from your Patient Dashboard without typing your contact details again.
                      </p>

                      {/* OPTIONAL MRN FIELD */}
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Patient Hospital ID / MRN Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MRN-88421"
                          value={mrnNumber}
                          onChange={(e) => setMrnNumber(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    /* GUEST UN-AUTHENTICATED PATIENT FORM */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name (पुरा नाम)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ram Bahadur Shrestha"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          WhatsApp / Mobile Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9841234567"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          placeholder="patient@example.com"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Patient ID / MRN Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MRN-88421"
                          value={mrnNumber}
                          onChange={(e) => setMrnNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileText className="w-5 h-5" />
                  <span>{submitting ? 'Lodging Complaint...' : 'Submit Grievance / उजुरी दर्ता गर्नुहोस्'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
