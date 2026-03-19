import Link from "next/link";

const GLOBAL_MENUS = [
  { href: "/lounge", label: "커뮤니티" },
  { href: "/lounge", label: "도감" },
  { href: "/lounge", label: "고객센터" },
];

export function Header() {
  return (
    <header className="border-b border-white/15 bg-black/35 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          href="/lounge"
          className="brand-heading text-xl text-white md:text-2xl"
        >
          세븐나이츠 리버스 라운지
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/5 p-1 md:flex">
          {GLOBAL_MENUS.map((menu) => (
            <Link
              key={menu.label}
              href={menu.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10 hover:text-white"
            >
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className="rounded-full border border-white/30 px-3 py-1.5 text-zinc-100 transition hover:bg-white/10"
          >
            로그인
          </button>
          <button
            type="button"
            className="rounded-full bg-amber-400 px-3 py-1.5 font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            마이페이지
          </button>
        </div>
      </div>
    </header>
  );
}
