import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { PHProvider } from './providers/PostHogProvider';
import PostHogPageView from './components/PostHogPageView';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from 'react';
import { ToastProvider } from '@/app/components/ui/Toast';
import PaymentSuccessHandler from '@/app/components/PaymentSuccessHandler';
import { TenantProvider } from '@/app/providers/TenantProvider';
import TenantSwitcher from '@/app/components/whitelabel/TenantSwitcher';

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

import { getTenantConfig, DEFAULT_TENANT_SLUG } from '@/app/config/tenant.config';

export async function generateMetadata(): Promise<Metadata> {
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT || DEFAULT_TENANT_SLUG;
  const tenant = getTenantConfig(tenantSlug);

  return {
    title: tenant.name,
    description: tenant.tagline || `Official application for ${tenant.name}`,
    icons: {
      icon: [
        {
          url: tenant.assets.faviconUrl || tenant.assets.logoUrl || '/favicon.ico',
        },
      ],
    },
    openGraph: {
      title: tenant.name,
      description: tenant.tagline || `Official application for ${tenant.name}`,
      images: [
        {
          url: tenant.assets.logoUrl,
          alt: `${tenant.name} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tenant.name,
      description: tenant.tagline || `Official application for ${tenant.name}`,
      images: [tenant.assets.logoUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${openSans.variable} font-sans bg-black text-white`}>
        <TenantProvider>
          <PHProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <ToastProvider>
              <Suspense fallback={null}>
                <PaymentSuccessHandler />
              </Suspense>
              {children}
              <TenantSwitcher />
              <Analytics />
              <SpeedInsights />
            </ToastProvider>
          </PHProvider>
        </TenantProvider>
      </body>
    </html>
  );
}