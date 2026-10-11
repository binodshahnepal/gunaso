'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShieldAlert, FileText, Search, UserCheck, Menu, X, Home, UserPlus, User, Phone } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [patient, setPatient] = useState<{ name: string; phone?: string | null } | null>(null);

  useEffect(() => {
    async function checkPatientSession() {
      try {
        const res = await fetch('/api/patient/me');
        const data = await res.json();
        if (data.success && data.patient) {
          setPatient(data.patient);
        }
      } catch (err) {
        // ignore
      }
    }
    checkPatientSession();
  }, []);

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* 1. OFFICIAL BPKCH PROMINENT HEADER BANNER */}
      <div className="bg-[#27548b] text-white border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3.5 sm:gap-5 group text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full p-1 shadow-lg shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/bkmch-logo.png"
                alt="B.P. Koirala Memorial Cancer Hospital Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>

            <div className="space-y-0.5">
              <h1 className="font-extrabold text-lg sm:text-2xl lg:text-3xl text-white tracking-tight leading-tight drop-shadow-sm">
                बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल
              </h1>
              <p className="font-bold text-xs sm:text-sm text-blue-100 tracking-wide">
                भरतपुर-७, चितवन, नेपाल • B.P. Koirala Memorial Cancer Hospital
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="bg-blue-900/80 text-blue-200 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  उजुरी तथा गुनासो व्यवस्थापन प्रणाली (Gunaso Portal)
                </span>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Inquiry / Emergency: 056-597005</span>
            </div>
            <div className="text-[11px] text-blue-100 flex items-center gap-1.5 font-medium">
              <span>Phone: <strong>056-597005</strong>, 056-524501</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION & ACTION BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#27548b] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Home className="w-4 h-4 text-[#27548b]" />
              <span>Home / गृहपृष्ठ</span>
            </Link>

            <Link
              href="/complaint/new"
              className="px-4 py-1.5 text-xs font-bold bg-[#27548b] hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Lodge Grievance / उजुरी दिनुहोस्</span>
            </Link>

            <Link
              href="/track"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#27548b] hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-[#27548b]" />
              <span>Track Status / स्थिति हेर्नुहोस्</span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {patient ? (
              <Link
                href="/patient/dashboard"
                className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-[#27548b] font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>My Complaints ({patient.name})</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/patient/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-[#27548b]" />
                  <span>Patient Sign In</span>
                </Link>
                <Link
                  href="/patient/register"
                  className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            <Link
              href="/admin/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 ml-2"
            >
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">BPKMCH Grievance Portal</span>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Home / गृहपृष्ठ
          </Link>
          <Link
            href="/complaint/new"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm font-bold bg-[#27548b] text-white rounded-md flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Lodge Grievance / उजुरी दिनुहोस्
          </Link>
          <Link
            href="/track"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-md flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-[#27548b]" />
            Track Status / स्थिति हेर्नुहोस्
          </Link>
          {patient ? (
            <Link
              href="/patient/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-[#27548b] bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              My Complaints ({patient.name})
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/patient/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm font-bold text-center text-slate-700 border border-slate-200 rounded-md"
              >
                Patient Sign In
              </Link>
              <Link
                href="/patient/register"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm font-bold text-center bg-amber-400 text-slate-950 rounded-md"
              >
                Sign Up
              </Link>
            </div>
          )}
          <Link
            href="/admin/login"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-md flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Admin Portal / प्रशासन लगइन
          </Link>

          <div className="pt-3 border-t border-slate-100 px-3 text-xs text-slate-600 space-y-1 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1.5 font-bold text-amber-700">
              <Phone className="w-3.5 h-3.5" />
              <span>Inquiry / Emergency: 056-597005</span>
            </div>
            <div>Phone: 056-597005, 056-524501</div>
            <div>Email: administration@bpkmch.gov.np</div>
          </div>
        </div>
      )}
    </header>
  );
}
