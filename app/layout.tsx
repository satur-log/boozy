import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const bmKkubulim = localFont({
  src: "../BMKkubulim.otf",
  variable: "--font-bm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boozy 🏎️ | 실시간 음주 레이싱",
  description: "소주잔을 누르며 음주 시속(km/h)을 측정하는 밈 기반 레이싱 웹 앱",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={bmKkubulim.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
