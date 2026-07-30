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

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

export const metadata: Metadata = {
  title: "EAST Sports Group",
  description: "Official application for EAST Sports Group",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  openGraph: {
    title: "EAST Sports Group",
    description: "Official application for EAST Sports Group",
    images: [
      {
        url: "/EAST-BLACK-BACKGROUND.png",
        width: 1200,
        height: 630,
        alt: "EAST Sports Group Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EAST Sports Group",
    description: "Official application for EAST Sports Group",
    images: ["/EAST-BLACK-BACKGROUND.png"],
  },
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
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </PHProvider>
      </body>
    </html>
  );
}