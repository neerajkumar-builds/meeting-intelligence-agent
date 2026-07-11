import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ConditionalShell } from "@/components/layout/conditional-shell";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prism | FullFunnel",
  description:
    "AI-powered meeting scoring, search, and coaching for the FullFunnel team",
  icons: {
    icon: "/favicon.svg",
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
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <Providers>
          <ConditionalShell>{children}</ConditionalShell>
          <Toaster position="bottom-right" richColors closeButton />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
