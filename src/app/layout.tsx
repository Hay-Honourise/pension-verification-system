import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oyo Pension Verification System",
  description: "Secure, Convenient, and Reliable Pensioner Verification for Retired Public Servants in Oyo State",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="bg-green-600">
          {children}
        </main>
      </body>
    </html>
  );
}
