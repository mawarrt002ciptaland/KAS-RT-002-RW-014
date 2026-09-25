import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { BrandLoader } from "@/components/brand-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Informasi RT 002 - Blok Mawar Ciptaland",
  description:
    "Digital Operating System RT 002 RW 014 Blok Mawar Perumahan Ciptaland Batam. Administrasi, keuangan, pelayanan, komunikasi, kegiatan, kependudukan, transparansi warga.",
  manifest: "/manifest.json",
  keywords: ["RT 002", "Blok Mawar", "Ciptaland", "Batam", "Sistem Informasi RT", "Kas RT", "Warga"],
  authors: [{ name: "Pengurus RT 002 Blok Mawar" }],
  applicationName: "Sistem Informasi RT 002",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RT 002 Mawar",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Sistem Informasi RT 002 - Blok Mawar Ciptaland",
    description: "Digital Operating System RT 002 RW 014 Blok Mawar Perumahan Ciptaland Batam",
    type: "website",
    siteName: "Sistem Informasi RT 002",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <BrandLoader />
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
