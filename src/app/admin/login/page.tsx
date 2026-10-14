'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { UserCheck, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { showErrorAlert, showToast } from '@/lib/alerts';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@hospital.gov.np');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user?.role === 'DEPT_HEAD' || data.user?.role === 'INVESTIGATOR') {
        showToast(`Welcome, ${data.user.name} (${data.user.department || 'Department Head'})!`, 'success');
        router.push('/staff/dashboard');
      } else {
        showToast(`Welcome, ${data.user?.name || 'Administrator'}!`, 'success');
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid credentials';
      setErrorMsg(msg);
      showErrorAlert('Authentication Failed / लगइन असफल', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-white rounded-full p-1 shadow-md mx-auto flex items-center justify-center border border-slate-200">
              <img
                src="/bkmch-logo.png"
                alt="BPKMCH Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin & Staff Portal</h1>
              <p className="text-xs text-slate-500 mt-1">
                बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल • Sujhaab & Grievance Administration
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Admin Dashboard'}</span>
            </button>
          </form>

          {/* DEMO CREDENTIALS BOX */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800">Demo Login Accounts:</div>
            <div>
              <span className="font-semibold text-slate-700">• Central Super Admin:</span>{' '}
              <code className="bg-white px-1 py-0.5 rounded text-slate-900 font-mono">admin@hospital.gov.np</code>
            </div>
            <div>
              <span className="font-semibold text-slate-700">• Emergency Dept Head:</span>{' '}
              <code className="bg-white px-1 py-0.5 rounded text-slate-900 font-mono">er.head@hospital.gov.np</code>
            </div>
            <div className="text-[11px] text-slate-500 pt-0.5">
              Password for all accounts: <code className="bg-white px-1 py-0.5 rounded text-slate-900 font-mono font-bold">Admin@123456</code>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
