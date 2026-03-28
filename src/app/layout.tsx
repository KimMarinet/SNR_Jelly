import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import "@toast-ui/editor/dist/toastui-editor.css";
import { AuthSessionProvider } from "@/components/auth/auth-session-provider";
import { ThemeInitializer } from "@/components/theme/theme-initializer";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  subsets: ["latin"],
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "세븐나이츠 리버스 라운지 입구",
  description: "세븐나이츠 리버스 공략 커뮤니티로 진입하는 프리-랜딩",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-theme="dark"
      suppressHydrationWarning
      className={`${notoSansKr.variable} ${blackHanSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeInitializer />
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
