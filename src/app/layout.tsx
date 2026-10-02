import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Starlink stats",
  description: "Public Starlink figures with sources and dates.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={plexSans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={plexSans.className}>{children}</body>
    </html>
  );
}
