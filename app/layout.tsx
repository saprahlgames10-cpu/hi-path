import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { GlobalErrorHandler } from "@/components/global-error-handler";

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

export const metadata: Metadata = {
  title: "HiPath - Your AI Co-Pilot for Learning Anything",
  description:
    "HiPath generates personalized, adaptive learning roadmaps powered by AI. Stop guessing what to learn next.",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "HiPath - AI-Powered Learning Roadmaps",
    description: "Your AI co-pilot for learning anything.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <GlobalErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  );
}
