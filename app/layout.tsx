import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { PHProvider } from './providers/PostHogProvider';
import PostHogPageView from './components/PostHogPageView';
import { Suspense } from 'react';

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });

export const metadata: Metadata = {
  title: "EAST Training App",
  description: "Sports training application",
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
          {children}
        </PHProvider>
      </body>
    </html>
  );
}