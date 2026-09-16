'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  TenantConfig,
  getTenantConfig,
  DEFAULT_TENANT_SLUG,
  hexToRgbChannels,
} from '@/app/config/tenant.config';

interface TenantContextValue {
  tenant: TenantConfig;
  setTenantSlug: (slug: string) => void;
  isCustomTenant: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: getTenantConfig(DEFAULT_TENANT_SLUG),
  setTenantSlug: () => {},
  isCustomTenant: false,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlugState] = useState<string>(() => {
    // 1. Check environment variable
    const envTenant = process.env.NEXT_PUBLIC_TENANT;
    if (envTenant) return envTenant;

    // 2. Client-side check for preview param or stored preference
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryTenant = urlParams.get('tenant');
        if (queryTenant) return queryTenant;

        const stored = localStorage.getItem('preview_tenant');
        if (stored) return stored;
      } catch {
        // Ignore storage read errors
      }
    }

    return DEFAULT_TENANT_SLUG;
  });

  const tenant = getTenantConfig(tenantSlug);

  // Apply CSS custom properties dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Inject CSS variables
    root.style.setProperty('--brand-primary', tenant.colors.primary);
    root.style.setProperty('--brand-primary-rgb', hexToRgbChannels(tenant.colors.primary));
    root.style.setProperty('--brand-primary-dark', tenant.colors.primaryDark);
    root.style.setProperty('--brand-primary-dark-rgb', hexToRgbChannels(tenant.colors.primaryDark));
    root.style.setProperty('--brand-accent', tenant.colors.accent);
    root.style.setProperty('--brand-accent-rgb', hexToRgbChannels(tenant.colors.accent));
    root.style.setProperty('--brand-black', tenant.colors.black);
    root.style.setProperty('--brand-black-rgb', hexToRgbChannels(tenant.colors.black));
    root.style.setProperty('--brand-card', tenant.colors.card);
    root.style.setProperty('--brand-card-rgb', hexToRgbChannels(tenant.colors.card));
    root.style.setProperty('--brand-glow', tenant.colors.glow);

    // Set data-tenant attribute for custom styling hooks
    root.setAttribute('data-tenant', tenant.slug);

    // Update document title for active tenant
    document.title = tenant.name;
  }, [tenant]);

  // Immediate client-side sync from URL query and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTenant = urlParams.get('tenant');
      if (queryTenant) {
        setTenantSlugState(queryTenant);
        localStorage.setItem('preview_tenant', queryTenant);
        return;
      }

      const stored = localStorage.getItem('preview_tenant');
      if (stored && stored !== tenantSlug) {
        setTenantSlugState(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  const setTenantSlug = (slug: string) => {
    setTenantSlugState(slug);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('preview_tenant', slug);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        setTenantSlug,
        isCustomTenant: tenant.slug !== DEFAULT_TENANT_SLUG,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
