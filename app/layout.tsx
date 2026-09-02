import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Billiard Timer Pro - Phần Mềm Bấm Giờ & Tính Tiền Bàn Bida",
  description: "Dự án web bấm giờ bàn bida chuyên nghiệp, đếm ngược shot clock thi đấu, đếm ngược thời gian và đồng hồ bấm giờ thể thao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-zinc-100">{children}</body>
    </html>
  );
}
