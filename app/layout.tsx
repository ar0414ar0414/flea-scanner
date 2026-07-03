import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Toaster from "@/components/Toaster";
import TabBar from "@/components/TabBar";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "フリマスキャナー",
  description: "中古品を撮影して相場と転売利益を即チェック",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "フリマスキャナー",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${noto.className} min-h-full bg-slate-50 text-slate-900`}>
        {children}
        <TabBar />
        <Toaster />
      </body>
    </html>
  );
}
