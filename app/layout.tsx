import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { PHProvider } from './providers/PostHogProvider';
import PostHogPageView from './components/PostHogPageView';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from 'react';
import { ToastProvider } from '@/app/components/ui/Toast';
import PaymentSuccessHandler from '@/app/components/PaymentSuccessHandler';

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

export const metadata: Metadata = {
  title: "EAST Sports Group",
  description: "Official application for EAST Sports Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${openSans.variable} font-sans bg-black text-white`}>
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ToastProvider>
            <Suspense fallback={null}>
              <PaymentSuccessHandler />
            </Suspense>
            {children}
          </ToastProvider>
          <SpeedInsights />
        </PHProvider>
      </body>
    </html>
  );
}