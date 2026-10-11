import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  FileText,
  Search,
  ShieldCheck,
  Clock,
  MessageSquare,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#27548b] via-[#1c3e69] to-slate-900 text-white overflow-hidden py-14 md:py-20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल • गुनासो प्रणाली</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                BPKMCH Patient Grievance & <br />
                <span className="text-amber-300">Gunaso Portal (गुनासो)</span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100/95 max-w-2xl leading-relaxed font-normal">
                Lodge complaints against any hospital department, unit, or personnel at B.P. Koirala Memorial Cancer Hospital. Track resolution progress transparently with your tracking ID.
              </p>

              <p className="text-xs text-blue-200 font-medium">
                तपाईंको उजुरीलाई पूर्ण रूपमा गोपनीय राखिनेछ। आकस्मिक तथा साधारण उजुरीको शीघ्र छानबिन र कारबाही गरिनेछ।
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/complaint/new"
                  className="w-full sm:w-auto px-7 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 group"
                >
                  <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>File a Complaint / उजुरी दिनुहोस्</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/track"
                  className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-2.5 backdrop-blur-md"
                >
                  <Search className="w-5 h-5 text-amber-300" />
                  <span>Track Complaint / स्थिति हेर्नुहोस्</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-blue-400/20 grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-blue-200">Anonymous Option</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-300">&lt; 24 Hours</div>
                  <div className="text-xs text-blue-200">Emergency SLA</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">WhatsApp</div>
                  <div className="text-xs text-blue-200">Instant Alerts</div>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-blue-700/60 backdrop-blur-md rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>Quick Status Tracker</span>
                  </div>
                  <span className="text-xs bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-mono">
                    GN-2026-8942
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-slate-400 font-medium">Sample Grievance Workflow Tracker:</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2.5 text-blue-300 font-medium bg-blue-950/60 p-2 rounded-lg border border-blue-900">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
                      <span>1. Complaint Submitted (उजुरी दर्ता भयो)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-blue-300 font-medium bg-blue-950/60 p-2 rounded-lg border border-blue-900">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
                      <span>2. Under Investigation (छानबिन हुँदैछ)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-amber-300 font-medium bg-blue-900/80 p-2 rounded-lg border border-blue-700 animate-pulse">
                      <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>3. Corrective Action Initiated (कारबाही सुरु)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-500 font-medium bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <div className="w-4 h-4 rounded-full border border-slate-700" />
                      <span>4. Resolved & Action Report Published</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/track"
                  className="block w-full text-center py-2.5 text-xs font-semibold text-blue-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Click to Enter Your Tracking ID →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Use the BPKMCH Gunaso Portal? / मुख्य विशेषताहरू
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Designed to uphold patient dignity, privacy, and accountability in cancer care & general hospital services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#27548b] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Anonymous Option</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose to hide your name and contact info. The system generates a 4-digit PIN for private tracking without revealing identity.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#27548b] flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">SLA & Escalation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Emergency grievances have a 24-hour SLA. Overdue complaints automatically escalate to the Hospital Medical Director.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#27548b] flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get automated WhatsApp updates on your phone whenever the grievance committee logs investigation findings or actions.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#27548b] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Action Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Read official administrative action summaries logged by grievance officers once investigation completes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES COVERED SECTION */}
      <section className="py-16 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Select What You Want to Report / उजुरीका क्षेत्रहरू
            </h2>
            <p className="text-slate-600 text-sm">
              Grievances can be lodged against specific hospital departments, units, or personnel:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { title: 'Emergency Care (ER)', desc: 'Delay in triage, doctor attention', icon: AlertTriangle },
              { title: 'Staff Behavior', desc: 'Rudeness, misconduct, negligence', icon: Users },
              { title: 'Billing & Insurance', desc: 'Overcharging, insurance counter delay', icon: Building2 },
              { title: 'Hygiene & Cleanliness', desc: 'Dirty wards, washrooms, bedding', icon: CheckCircle2 },
              { title: 'Pharmacy & Medicines', desc: 'Cancer medicine stock, delay', icon: Clock },
              { title: 'OPD & Ticket Delay', desc: 'Long queue, ticket counter delay', icon: Clock },
              { title: 'Lab & Radiology', desc: 'Biopsy reports, X-Ray, CT Scan', icon: Building2 },
              { title: 'ICU & Oncology Wards', desc: 'Nursing care, cabin issues', icon: ShieldCheck },
            ].map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={idx}
                  href="/complaint/new"
                  className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#27548b] hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#27548b] flex items-center justify-center mb-3 group-hover:bg-[#27548b] group-hover:text-white transition-colors">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#27548b] transition-colors">
                    {cat.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEPPER */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How It Works / प्रक्रिया कसरी अगाडि बढ्छ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: '01', title: 'Fill Form', desc: 'Select department, unit, person, location, and write your narrative.' },
              { step: '02', title: 'Get Tracking ID', desc: 'Receive a unique Token ID (e.g. GN-2026-8942) and instant WhatsApp alert.' },
              { step: '03', title: 'Admin Investigation', desc: 'Grievance committee reviews issue and assigns corrective action to department head.' },
              { step: '04', title: 'Resolution Report', desc: 'Track live progress online and read official action report & submit feedback.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="text-3xl font-extrabold text-[#27548b]/30 mb-2">{item.step}</div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/complaint/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-base rounded-xl shadow-md transition-all"
            >
              <FileText className="w-5 h-5" />
              <span>Start Filing Complaint Now / उजुरी दिनुहोस्</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
