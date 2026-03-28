import { getServerSession } from "next-auth";
import { Footer } from "@/components/layout/footer";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const accountLabel =
    session?.user?.nickname ?? session?.user?.name ?? session?.user?.email ?? "알 수 없는 계정";

  return (
    <div className="layout-shell hub-shell min-h-screen">
      <header
        className="border-b backdrop-blur-md"
        style={{
          borderColor: "var(--hub-border)",
          backgroundColor: "color-mix(in srgb, var(--hub-bg) 94%, transparent)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p
              className="text-lg font-black tracking-tight md:text-xl [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              SNR Jelly
            </p>
          </div>

          <div
            className="inline-flex max-w-full items-center gap-3 rounded-full border px-3 py-1.5 text-sm"
            style={{
              borderColor: "var(--hub-border)",
              backgroundColor: "var(--hub-surface-alt)",
              color: "var(--hub-text)",
            }}
          >
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: "var(--hub-accent-soft)",
                color: "var(--hub-accent)",
              }}
            >
              ADMIN
            </span>
            <span className="truncate">{accountLabel}</span>
          </div>
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <div className="admin-backdrop" aria-hidden />
        <div className="scanline absolute inset-0 opacity-[0.16]" aria-hidden />
        <div className="relative w-full px-0 py-5 md:py-6">
          {children}
        </div>
      </div>
      <Footer variant="hub" />
    </div>
  );
}
