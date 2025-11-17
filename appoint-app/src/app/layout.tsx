import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TRPCProvider } from "./providers";
// import { UserSyncProvider } from "./user-sync-provider"; // DISABLED - sync happens automatically in tRPC context

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appointments Platform",
  description: "Plataforma de citas para negocios en Argentina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <TRPCProvider>
            {/* UserSyncProvider disabled - user sync happens automatically in tRPC context */}
            {children}
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
