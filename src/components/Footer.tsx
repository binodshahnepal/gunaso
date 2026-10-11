import Link from 'next/link';
import { ShieldCheck, Phone, Mail, MapPin, MessageSquareText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a385c] border-t border-blue-900/60 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Hospital Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3 text-white font-bold text-lg">
              <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/bkmch-logo.png"
                  alt="BPKCH Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-white">BPKCH Gunaso Portal</div>
                <div className="text-[10px] text-blue-200 font-normal">बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल</div>
              </div>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Official Grievance & Complaint Redressal Portal for B.P. Koirala Memorial Cancer Hospital, Bharatpur-7, Chitwan. Dedicated to transparent patient care, quality healthcare, and prompt issue investigation.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-blue-800/80 pb-2">
              Quick Actions / मुख्य लिङ्कहरू
            </h3>
            <ul className="space-y-2.5 text-xs text-blue-100">
              <li>
                <Link href="/complaint/new" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  📝 File a Complaint (उजुरी दर्ता)
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  🔍 Track Ticket Status (स्थिति हेर्नुहोस्)
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  🔐 Admin Portal (प्रशासन लगइन)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Departments Covered */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-blue-800/80 pb-2">
              Departments Covered
            </h3>
            <ul className="space-y-1.5 text-xs text-blue-200/90">
              <li>• Radiation Oncology & Surgical Oncology</li>
              <li>• Medical Oncology & Palliative Care</li>
              <li>• Emergency (ER) & ICU / CCU Wards</li>
              <li>• Outpatient (OPD) & Inpatient Wards</li>
              <li>• Radiology, Pathology & Nuclear Medicine</li>
              <li>• Billing, Cash Counters & Health Insurance</li>
            </ul>
          </div>

          {/* Col 4: BPKCH Grievance Cell Contact */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-blue-800/80 pb-2">
              Grievance Cell / गुनासो कक्ष
            </h3>
            <ul className="space-y-3 text-xs text-blue-100">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>B.P. Koirala Memorial Cancer Hospital, Bharatpur-7, Chitwan, Nepal</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+977-56-524501 / 525555 / 9855000000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>gunaso@bpkch.org.np / info@bpkch.org.np</span>
              </li>
              <li className="flex items-center gap-2.5 text-amber-300 text-xs">
                <MessageSquareText className="w-4 h-4 shrink-0" />
                <span>WhatsApp Grievance Alerts Enabled</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300/80">
          <p>© 2026 B.P. Koirala Memorial Cancer Hospital (BPKCH) Gunaso Portal. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Confidential • Secure • Transparent</p>
        </div>
      </div>
    </footer>
  );
}
