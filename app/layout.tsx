import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans", // Keeping variable name same to avoid globals.css edits if defined
  subsets: ["latin", "vietnamese"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Billiard Scoreboard",
  description: "A minimalist billiard scoreboard app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Billiard",
  },
};

export const viewport: Viewport = {
  themeColor: "black",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased overscroll-none overflow-hidden touch-none select-none w-full h-[100dvh]`}
      >
        {children}
      </body>
    </html>
  );
}
