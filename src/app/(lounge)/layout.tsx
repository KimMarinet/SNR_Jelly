import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SideNavigation } from "@/components/layout/side-navigation";

export default function LoungeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="layout-shell hub-shell min-h-screen">
      <Header variant="hub" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-5 px-4 py-5 md:px-6">
        <SideNavigation variant="hub" />
        <main className="hub-panel flex-1 border p-4 md:p-6">{children}</main>
      </div>
      <Footer variant="hub" />
    </div>
  );
}
