import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { LoadingProvider } from "@/contexts/loading-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyLessons - Quiz Interaktif Multiplayer",
  description: "Platform quiz multiplayer yang menyenangkan seperti Kahoot",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <LoadingProvider>
          <AuthProvider>{children}</AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
