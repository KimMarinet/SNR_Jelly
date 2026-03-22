import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SideNavigation } from "@/components/layout/side-navigation";

export default function LoungeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="layout-shell min-h-screen">
      <Header />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-4 px-4 py-5 md:px-6">
        <SideNavigation />
        <main className="theme-panel flex-1 rounded-2xl border p-4 backdrop-blur-sm md:p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
