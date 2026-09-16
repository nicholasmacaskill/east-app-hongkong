'use client';

import React, { useState } from 'react';
import { useTenant } from '@/app/providers/TenantProvider';
import { TENANT_PRESETS } from '@/app/config/tenant.config';

export default function TenantSwitcher() {
  const { tenant, setTenantSlug } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  // White-label switcher is strictly a dev utility.
  // Never show in production, on dedicated tenant deployments (e.g. Jr Ducks), or when explicitly disabled
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_DISABLE_TENANT_SWITCHER === 'true' ||
    process.env.NEXT_PUBLIC_TENANT === 'jrducks'
  ) {
    return null;
  }

  return (
    <aside aria-label="White-label Tenant Switcher" className="fixed bottom-4 right-4 z-[9999] font-sans">
      {isOpen ? (
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white w-72 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: tenant.colors.primary }} />
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-300">White-Label Switcher</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {Object.values(TENANT_PRESETS).map((t) => {
              const isSelected = t.slug === tenant.slug;
              return (
                <button
                  key={t.slug}
                  data-testid={`tenant-switch-${t.slug}`}
                  onClick={() => setTenantSlug(t.slug)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white/10 border-white/40 shadow-inner'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <div>
                      <div className="text-xs font-black italic tracking-wide">{t.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {t.location} • {t.currency}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: t.colors.primary, color: '#000000' }}
                    >
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Primary Sport:</span>
            <span className="font-bold text-white uppercase">{tenant.primarySport}</span>
          </div>
        </div>
      ) : (
        <button
          data-testid="tenant-switcher-toggle"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/20 hover:border-white/40 px-3.5 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.6)] text-white text-xs font-bold transition-all active:scale-95 group"
        >
          <span
            className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125"
            style={{ backgroundColor: tenant.colors.primary }}
          />
          <span className="font-black italic uppercase tracking-wider text-[11px]">
            {tenant.shortName}
          </span>
          <span className="text-[10px] text-gray-400 font-normal">Theme</span>
        </button>
      )}
    </aside>
  );
}
