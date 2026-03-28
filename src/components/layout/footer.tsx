const EXTERNAL_LINKS = [
  { href: "https://forum.netmarble.com/sknightsm", label: "Terminal" },
  { href: "https://www.netmarble.com/ko", label: "Download" },
  { href: "https://www.youtube.com", label: "Broadcast" },
];

type FooterVariant = "default" | "hub";

type FooterProps = {
  variant?: FooterVariant;
};

export function Footer({ variant = "default" }: FooterProps = {}) {
  if (variant === "hub") {
    return (
      <footer className="border-t" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}>
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-6">
            <span
              className="text-sm font-black tracking-tight md:text-base [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              SNR Jelly
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.08em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-muted)" }}
            >
              2026 Tactical Community Interface
            </span>
          </div>

          <div className="flex flex-wrap gap-6">
            {EXTERNAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] uppercase tracking-[0.08em] transition [font-family:var(--font-space-grotesk),sans-serif]"
                style={{ color: "var(--hub-muted)" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="theme-border theme-elevated border-t">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-5 text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <p className="theme-text-muted">© 2026 세븐나이츠 리버스 라운지. 전술 데이터 공유 거점.</p>
        <div className="flex flex-wrap gap-4">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="theme-text-muted underline-offset-2 transition hover:opacity-90 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
