import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import TabBlockerProvider from "@/components/providers/TabBlockerProvider";
import StoreLayoutWrapper from "@/components/layout/StoreLayoutWrapper";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Market | Enterprise SaaS Portal",
  description: "Modern, scalable enterprise SaaS application with role-based dashboard portals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <AuthProvider>
          <TabBlockerProvider>
            <StoreLayoutWrapper>
              {children}
            </StoreLayoutWrapper>
          </TabBlockerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
