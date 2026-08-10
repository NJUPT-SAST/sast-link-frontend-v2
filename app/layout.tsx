import type { Metadata } from "next";
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

// Sets the --background variable inline (not the background itself) so the
// first paint is the right theme color before CSS applies — and so the <html>
// element stays background-less, keeping the -z-10 starfield canvas visible.
// Keep #060606 / #fafafa in sync with globals.css.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var l=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var d=t==='dark'||(t!=='light'&&!l);var el=document.documentElement;el.style.setProperty('--background',d?'#060606':'#fafafa');if(d)el.classList.add('dark')}catch(e){var el=document.documentElement;el.style.setProperty('--background','#060606');el.classList.add('dark')}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* React 19 hoists a raw inline <script> into <head> and executes it
            once before first paint (no flash of the wrong theme). next/script
            with beforeInteractive is not supported in the App Router. */}
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
