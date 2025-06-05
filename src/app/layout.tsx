import type { Metadata } from "next";
import "./globals.css";
import "./lib/envSetup";
import { Inter } from "next/font/google";
import { TranscriptProvider } from "./contexts/TranscriptContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Realtime API Agents",
  description: "A demo app from OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${inter.className}`}>
        <TranscriptProvider>
          {children}
        </TranscriptProvider>
      </body>
    </html>
  );
}
