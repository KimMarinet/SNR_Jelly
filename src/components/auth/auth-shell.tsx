import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

const AUTH_HIGHLIGHTS = [
  "실전 공략과 운영 팁을 한곳에서 정리",
  "라운지, 공략 게시판, 최신 브리핑을 빠르게 확인",
  "커뮤니티 활동을 위한 계정 연동 지원",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="hub-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12%] top-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(204,255,0,0.18)_0%,_rgba(204,255,0,0)_72%)] blur-2xl" />
        <div className="absolute bottom-[-16%] right-[-8%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(250,204,21,0.18)_0%,_rgba(250,204,21,0)_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.9)_0%,rgba(14,14,16,0.96)_100%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1240px] items-center px-4 py-10 md:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_520px]">
          <section className="hidden rounded-[28px] border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-surface)_82%,transparent)] p-10 shadow-[0_32px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between">
            <div className="space-y-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hub-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--hub-accent-soft)_84%,transparent)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--hub-accent)] [font-family:var(--font-space-grotesk),sans-serif]">
                <span className="h-2 w-2 rounded-full bg-[var(--hub-accent)] shadow-[0_0_14px_var(--hub-accent)]" />
                SNR Jelly Access
              </div>

              <div className="space-y-5">
                <Link
                  href="/lounge"
                  className="inline-block text-3xl font-black uppercase tracking-[-0.04em] text-[var(--hub-text)] [font-family:var(--font-space-grotesk),sans-serif]"
                >
                  SNR Jelly
                </Link>
                <h1 className="max-w-lg text-5xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-[var(--hub-text)] [font-family:var(--font-space-grotesk),sans-serif]">
                  Seven Knights Rebirth
                  <span className="mt-3 block text-[var(--hub-accent)]">Community Access</span>
                </h1>
                <p className="max-w-xl text-base leading-8 text-[color-mix(in_srgb,var(--hub-muted)_82%,white_18%)]">
                  공략과 브리핑, 라운지 대화를 한 흐름으로 연결하는 전용 진입 구간입니다.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {AUTH_HIGHLIGHTS.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-[color-mix(in_srgb,var(--hub-border)_90%,transparent)] bg-[color-mix(in_srgb,var(--hub-surface-alt)_56%,transparent)] px-5 py-4 text-sm text-[var(--hub-text)]"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </section>

          <section className="relative flex items-center overflow-hidden rounded-[28px] border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-surface)_92%,black_8%)] shadow-[0_36px_90px_-54px_rgba(0,0,0,0.96)]">
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(204,255,0,0.7),transparent)]" />
            <div className="relative w-full p-6 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--hub-accent)] [font-family:var(--font-space-grotesk),sans-serif]">
                    {eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--hub-text)] [font-family:var(--font-space-grotesk),sans-serif]">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--hub-muted)]">
                    {description}
                  </p>
                </div>
              </div>

              {children}

              <div className="mt-8 border-t border-[color-mix(in_srgb,var(--hub-border)_82%,transparent)] pt-6 text-sm text-[var(--hub-muted)]">
                {footer}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
