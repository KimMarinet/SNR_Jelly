const EXTERNAL_LINKS = [
  { href: "https://forum.netmarble.com/sknightsm", label: "공식 포럼" },
  { href: "https://www.netmarble.com/ko", label: "게임 다운로드" },
  { href: "https://www.youtube.com", label: "공식 채널" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/15 bg-black/25">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-5 text-sm text-zinc-300 md:flex-row md:items-center md:justify-between md:px-6">
        <p>© 2026 세븐나이츠 리버스 라운지. 전술 데이터 공유 거점.</p>
        <div className="flex flex-wrap gap-4">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 transition hover:text-white hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
