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

export const metadata: Metadata = {
  title: "AyurVeda Desi Foods - Premium Ayurvedic & Traditional Indian Products",
  description:
    "Discover authentic Ayurvedic herbs, premium dry fruits, dehydrated foods, and fresh tofu. Bringing ancient wisdom to modern wellness with 100% natural products.",
  keywords: [
    "Ayurveda",
    "Desi Foods",
    "Dry Fruits",
    "Herbs",
    "Tofu",
    "Natural Products",
    "Indian Traditional",
    "Wellness",
  ],
  authors: [{ name: "AyurVeda Desi Foods" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AyurVeda Desi Foods - Authentic Indian Wellness",
    description: "Premium Ayurvedic products and traditional Indian foods",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AyurVeda Desi Foods",
    description: "Authentic Ayurvedic products and traditional Indian foods",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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