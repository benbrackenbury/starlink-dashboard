import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starlink stats",
  description: "Public Starlink figures with sources and dates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
