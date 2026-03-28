export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="layout-shell hub-shell min-h-screen">
      <div className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 12% 10%, var(--hub-hero-glow-a), transparent 35%), radial-gradient(circle at 88% 90%, var(--hub-hero-glow-b), transparent 30%)",
          }}
          aria-hidden
        />
        <div className="scanline absolute inset-0 opacity-[0.14]" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6">
          <main className="hub-panel border p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
