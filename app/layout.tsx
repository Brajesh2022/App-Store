import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "vlyx.mod - Premium MOD APK Downloads",
  description: "Discover and download premium Android apps and games with advanced mod features. Clean, safe, and lightning-fast downloads for all your favorite apps. Made by Brajesh",
  keywords: "mod apk, android mods, premium apps, modded games, vlyx mod, apk download, unlocked features, free premium apps",
  authors: [{ name: "Brajesh" }],
  creator: "Brajesh",
  publisher: "vlyx.mod",
  robots: "index, follow",
  openGraph: {
    title: "vlyx.mod - Premium MOD APK Downloads",
    description: "Premium Android MOD APKs with unlocked features. Made by Brajesh",
    url: "https://vlyx.mod",
    siteName: "vlyx.mod",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "vlyx.mod - Premium MOD APK Downloads", 
    description: "Premium Android MOD APKs with unlocked features. Made by Brajesh",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "vlyx.mod"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
