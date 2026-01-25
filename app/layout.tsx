import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Clerk removed: import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/components/common/auth-provider";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/common/conditional-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Checks Admin",
  description: "Admin panel",
  // icons: {
  //   icon: "/logo.svg",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
