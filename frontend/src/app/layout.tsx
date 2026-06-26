import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/auth-context";
import { AuthSheet } from "@/components/auth/AuthSheet";
import PageTracker from "@/components/analytics/PageTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Oroganix - Premium Ayurvedic & Organic Products | Buy Natural Herbs Online",
    template: "%s | Oroganix",
  },
  description: "Shop authentic Ayurvedic herbs, organic supplements, premium dry fruits, and natural wellness products. 100% organic, lab-tested, farm-direct. Free delivery above ₹499.",
  keywords: [
    "Ayurvedic products online",
    "buy organic herbs India",
    "natural supplements",
    "Ayurveda",
    "organic dry fruits",
    "herbal remedies",
    "Oroganix",
    "triphala",
    "ashwagandha",
    "wellness products",
    "FSSAI certified",
    "lab tested herbs",
  ],
  authors: [{ name: "Oroganix" }],
  creator: "Oroganix",
  publisher: "Oroganix",
  icons: {
    icon: "/logo.svg",
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Oroganix - Premium Ayurvedic & Organic Products",
    description: "Shop authentic Ayurvedic herbs, organic supplements, and natural wellness products. 100% organic, lab-tested, farm-direct.",
    type: "website",
    siteName: "Oroganix",
    locale: "en_IN",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Oroganix - Premium Ayurvedic Products",
    description: "Shop authentic Ayurvedic herbs and organic wellness products. 100% natural, lab-tested.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </head>
      <AuthProvider>
        <body
          suppressHydrationWarning   // ✅ THIS FIXES YOUR ERROR
          className={`${inter.variable} font-sans antialiased bg-background text-foreground relative z-0`}
        >
          <PageTracker />
          {children}
  <AuthSheet />

<Toaster
  position="bottom-right"
  reverseOrder={false}
  containerStyle={{
    zIndex: 999999,
  }}
  toastOptions={{
    duration: 3500,
    style: {
      borderRadius: "10px",
      background: "#1f2937",
      color: "#fff",
      fontSize: "14px",
    },
    success: {
      iconTheme: {
        primary: "#10b981",
        secondary: "#fff",
      },
    },
    error: {
      iconTheme: {
        primary: "#ef4444",
        secondary: "#fff",
      },
    },
  }}
/>

          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />

        </body></AuthProvider>
    </html>
  );
}