import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pado-story.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "파도스토리 | 산지 직송 수산물", template: "%s | 파도스토리" },
  description: "통영·완도·목포 산지의 신선한 수산물을 식탁까지 연결합니다.",
  keywords: ["파도스토리", "산지직송", "수산물", "전복", "참소라", "굴", "바다장어"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "파도스토리",
    title: "파도스토리 | 산지 직송 수산물",
    description: "통영·완도·목포 산지의 신선한 수산물을 식탁까지 연결합니다.",
    images: [{ url: "/images/story/hero-conch.webp", width: 1200, height: 630, alt: "파도스토리 산지 직송 수산물" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "파도스토리 | 산지 직송 수산물",
    description: "통영·완도·목포 산지의 신선한 수산물을 식탁까지 연결합니다.",
    images: ["/images/story/hero-conch.webp"]
  },
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><CartProvider><Header /><main>{children}</main><Footer /></CartProvider></body></html>;
}
