import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { AuthWrapper } from "@/components/auth-wrapper";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Khos shop - Барааны код удирдлага",
  description: "Барааны код удирдлагын систем",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className={`${rubik.variable} antialiased`}
      >
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
