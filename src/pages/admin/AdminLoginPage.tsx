import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { TbdLogo } from '../../components/TbdLogo';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, returnToStore } = useStore();
  const [email, setEmail] = useState('admin@tbdwellness.com');
  const [password, setPassword] = useState('ClinicalVitality#2025');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await loginAdmin(email.trim(), password);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#F4F7FB] text-[#061B3A]">
      <header className="border-b border-[#D8E2EA] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <TbdLogo variant="light" size="sm" />
            <span className="hidden sm:inline text-xs font-medium text-[#5A6C82]">
              · Executive Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => returnToStore('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075CA8] hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-[#D8E2EA] bg-white p-8 shadow-[0_18px_40px_rgba(6,27,58,0.07)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9F6FD] text-[#075CA8]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#061B3A]">
            Executive Admin Sign In
          </h1>
          <p className="mt-1 text-sm text-[#465970]">
            Authenticate with your MySQL-backed admin account to manage catalog, orders, CMS, and finance.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold text-[#354B66]"
              >
                Corporate Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold text-[#354B66]"
              >
                Security Passkey
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] py-2.5 pl-3.5 pr-10 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#061B3A]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-[#465970]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                />
                <span>Keep JWT session active</span>
              </label>
              <span className="font-mono text-[11px] text-[#075CA8]">MySQL Auth Live</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#061B3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082B58] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 border-t border-[#E6EEF5] pt-4 text-xs text-[#5A6C82]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#008FD3]" />
            <span>JWT-authenticated MySQL operations · All mutations persist live.</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#D8E2EA] bg-white py-4 text-center text-xs text-[#5A6C82]">
        TBD Wellness Clinical Commerce Operations · Internal Portal
      </footer>
    </div>
  );
};
