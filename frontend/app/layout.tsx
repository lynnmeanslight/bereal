import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeReal — Continuous Clearing Auctions",
  description:
    "Launch tokens the human way with Continuous Clearing Auctions on Unichain. Create auctions, bid with escrowed ETH, and verify participation with World ID.",
  metadataBase: new URL("https://bereal.nyilynnhtwe.xyz/"),
  openGraph: {
    title: "BeReal — Continuous Clearing Auctions",
    description:
      "Launch tokens the human way with Continuous Clearing Auctions on Unichain. Create auctions, bid with escrowed ETH, and verify participation with World ID.",
    type: "website",
    url: "https://bereal.nyilynnhtwe.xyz/",
    siteName: "BeReal",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeReal — Continuous Clearing Auctions",
    description:
      "Launch tokens the human way with Continuous Clearing Auctions on Unichain. Create auctions, bid with escrowed ETH, and verify participation with World ID.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
