import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Poppins } from "next/font/google";
import I18nProvider from "@/providers/I18nProvider";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "SASPAK CARGO Management System",
  description: "Comprehensive ERP system for logistics and cargo management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Load Google Maps API using Next.js Script component */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places`}
          strategy='afterInteractive'
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.className} antialiased`}
        suppressHydrationWarning
      >
        {/* Global Background with Globe Theme */}
        <div className='fixed inset-0 -z-10'>
          {/* Globe Background Image */}
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
            }}
          >
            {/* Overlay gradient matching login page */}
            <div className='absolute inset-0 bg-gradient-to-br from-[#0B4F6C]/95 via-[#0D5C7D]/90 to-[#1A94D4]/85'></div>
          </div>

          {/* Static Background Elements (removed animation to prevent hydration issues) */}
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl'></div>
            <div className='absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl'></div>
          </div>
        </div>

        {/* Content */}
        <div className='relative z-10 min-h-screen'>
          <I18nProvider>{children}</I18nProvider>
        </div>

        <Toaster />
      </body>
    </html>
  );
}
