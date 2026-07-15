import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import Providers from "@/providers";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dexnive CRM",
  description: "Manage Team, Projects, Divisions, Departments, Rates and Hours",
  icons: {
    icon: "/images/icon-dx.png",
    shortcut: "/images/icon-dx.png",
    apple: "/images/icon-dx.png",
  },
  openGraph: {
    title: "Dexnive CRM",
    description: "Manage Team, Projects, Divisions, Departments, Rates and Hours",
    siteName: "Dexnive CRM",
    images: [
      {
        url: "/images/icon-dx.png",
        width: 512,
        height: 512,
        alt: "Dexnive Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dexnive CRM",
    description: "Manage Team, Projects, Divisions, Departments, Rates and Hours",
    images: ["/images/icon-dx.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`min-h-full flex flex-col ${outfit.className}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
