import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAST Link",
  description: "OAuth of SAST",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var l=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var d=t==='dark'||(t!=='light'&&!l);if(d)document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* beforeInteractive inlines the theme guard into the initial HTML so
            it runs before first paint (no flash of the wrong theme) and Next
            manages it — a raw <script> would trigger React 19's warning. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
