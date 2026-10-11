'use client';

import Link from 'next/link';
import { WifiOff, Phone, RotateCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-full p-1 mx-auto shadow-md border border-slate-200 flex items-center justify-center">
          <img
            src="/bkmch-logo.png"
            alt="BPKMCH Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>इन्टरनेट सम्पर्क विच्छेद भयो (Offline)</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            तपाईं अहिले अफलाइन हुनुहुन्छ
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please check your mobile data or Wi-Fi connection. Once reconnected, you can lodge or track grievances smoothly.
          </p>
        </div>

        {/* Emergency Call Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="font-bold text-[#27548b] flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-amber-500" />
            <span>तत्काल सम्पर्कका लागि (Hospital Helpline):</span>
          </div>
          <div className="space-y-1 text-slate-700 font-medium">
            <div>• Emergency / Inquiry: <a href="tel:056597005" className="text-blue-700 font-bold underline">056-597005</a></div>
            <div>• Hospital Exchange: <a href="tel:056524501" className="text-blue-700 font-bold underline">056-524501</a></div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-[#27548b] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            <span>पुनः प्रयास गर्नुहोस् (Retry)</span>
          </button>

          <Link
            href="/"
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>गृहपृष्ठ (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
