'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';

interface ConnectStatus {
  connectEnabled: boolean;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_onboarding_complete: boolean;
  readyForCheckout: boolean;
}

export default function PaymentsSettingsPage() {
  const { addToast } = useToast();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadStatus = useCallback(async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stripe/connect/status?refresh=${refresh}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load payment status');
      setStatus(data);
    } catch (error: any) {
      addToast(error.message || 'Failed to load payment status', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldRefresh = params.get('connected') === 'true' || params.get('refresh') === 'true';
    loadStatus(shouldRefresh);

    if (shouldRefresh) {
      window.history.replaceState({}, '', '/sys-admin/payments');
    }
  }, [loadStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start Stripe onboarding');
      }
      window.location.href = data.url;
    } catch (error: any) {
      addToast(error.message || 'Could not start Stripe onboarding', 'error');
      setConnecting(false);
    }
  };

  const isConnected = !!status?.stripe_onboarding_complete && status.readyForCheckout;
  const isPending = !!status?.stripe_account_id && !isConnected;

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-3xl">
      <div>
        <Link
          href="/sys-admin"
          className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-white mb-4 block transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Payments</h1>
        <p className="text-gray-400 mt-2 text-sm leading-relaxed">
          Connect your organization&apos;s Stripe account when you&apos;re ready to accept memberships and credit top-ups.
          Until then, admins can still grant credits manually from the People Directory.
        </p>
      </div>

      <div className="bg-[#1e1e1e] rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400 text-sm font-bold uppercase tracking-widest">
            <Loader2 className="animate-spin" size={18} />
            Checking payment status...
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  isConnected
                    ? 'bg-[#28D160]/20 text-[#28D160]'
                    : isPending
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-white/5 text-gray-400'
                }`}
              >
                {isConnected ? <CheckCircle2 size={24} /> : <CreditCard size={24} />}
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black italic uppercase">
                  {isConnected
                    ? 'Stripe Connected'
                    : isPending
                      ? 'Setup In Progress'
                      : 'Stripe Not Connected'}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {isConnected
                    ? 'Parents can purchase memberships and top up credits through checkout.'
                    : isPending
                      ? 'Finish onboarding in Stripe to enable live payments.'
                      : 'Click below when you are ready. Stripe will collect business details and your US bank account for payouts.'}
                </p>
              </div>
            </div>

            {status?.stripe_account_id && (
              <div className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-[11px] text-gray-500 font-mono break-all">
                Account: {status.stripe_account_id}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest">
              <StatusPill label="Details submitted" active={!!status?.stripe_details_submitted} />
              <StatusPill label="Charges enabled" active={!!status?.stripe_charges_enabled} />
              <StatusPill label="Payouts enabled" active={!!status?.stripe_payouts_enabled} />
              <StatusPill label="Checkout ready" active={!!status?.readyForCheckout} />
            </div>

            {!status?.connectEnabled && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>Stripe Connect is disabled on this deployment.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!isConnected && status?.connectEnabled && (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center justify-center gap-2 bg-[#28D160] text-black font-black italic uppercase px-6 py-4 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                  {isPending ? 'Continue Stripe Setup' : 'Connect with Stripe'}
                </button>
              )}

              <button
                onClick={() => loadStatus(true)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 border border-white/10 text-white font-black italic uppercase px-6 py-4 rounded-xl hover:border-white/30 transition-colors disabled:opacity-50"
              >
                Refresh Status
              </button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3 text-sm text-gray-400">
        <h3 className="text-white font-black italic uppercase text-xs tracking-widest">Before you connect</h3>
        <ul className="space-y-2 list-disc pl-5">
          <li>Have your business legal name, address, and tax ID (EIN or SSN) ready.</li>
          <li>Use a US bank account for payouts (routing + account number).</li>
          <li>Stripe may take a short time to verify everything after submission.</li>
          <li>Test mode still works for demos before going live.</li>
        </ul>
        <Link
          href="/sys-admin/directory"
          className="inline-flex items-center gap-2 text-[#28D160] text-xs font-black uppercase tracking-widest hover:text-white transition-colors pt-2"
        >
          Grant demo credits manually <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-2 text-center ${
        active ? 'border-[#28D160]/40 bg-[#28D160]/10 text-[#28D160]' : 'border-white/10 text-gray-600'
      }`}
    >
      {label}
    </div>
  );
}