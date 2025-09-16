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
  applicationName: "vlyx.mod",
  title: {
    default: "vlyx.mod — Premium APK & MOD Downloads",
    template: "%s — vlyx.mod",
  },
  description: "Made by Brajesh. Discover and download premium Android apps and games with MOD features. Clean, safe, and fast downloads at vlyx.mod.",
  keywords: [
    "vlyx.mod",
    "apk",
    "mod apk",
    "premium apps",
    "android games",
    "safe downloads",
  ],
  authors: [{ name: "Brajesh" }],
  creator: "Brajesh",
  publisher: "vlyx.mod",
  metadataBase: new URL("https://vlyx.mod"),
  alternates: { canonical: "/" },
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: "https://vlyx.mod/",
    title: "vlyx.mod — Premium APK & MOD Downloads",
    description: "Made by Brajesh. Discover and download premium Android apps and games with MOD features.",
    siteName: "vlyx.mod",
  },
  twitter: {
    card: "summary_large_image",
    title: "vlyx.mod — Premium APK & MOD Downloads",
    description: "Made by Brajesh. Discover and download premium Android apps and games with MOD features.",
    creator: "@vlyxmod",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxImagePreview: "large",
      maxSnippet: -1,
      maxVideoPreview: -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "vlyx.mod",
  }
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
        <meta name="author" content="Brajesh" />
        <meta name="application-name" content="vlyx.mod" />
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
