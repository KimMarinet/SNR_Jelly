import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="layout-shell min-h-screen">
      <Header />
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 md:px-6">
        <main className="theme-panel rounded-2xl border p-4 backdrop-blur-sm md:p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
