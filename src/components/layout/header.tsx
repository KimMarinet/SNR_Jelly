import Link from "next/link";
import { getServerSession } from "next-auth";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { authOptions } from "@/lib/auth";

const GLOBAL_MENUS = [
  { href: "/lounge", label: "커뮤니티" },
  { href: "/lounge", label: "도감" },
  { href: "/lounge", label: "고객센터" },
];

export async function Header() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user?.id);
  const isAdmin = session?.user?.role === "ADMIN";
  const displayName = session?.user?.nickname ?? session?.user?.name ?? session?.user?.email;

  return (
    <header className="theme-border theme-elevated border-b backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/lounge" className="brand-heading theme-text-strong text-xl md:text-2xl">
          세븐나이츠 리버스 라운지
        </Link>

        <nav className="theme-chip hidden items-center gap-2 rounded-full border p-1 md:flex">
          {GLOBAL_MENUS.map((menu) => (
            <Link
              key={menu.label}
              href={menu.href}
              className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-90"
              style={{ color: "var(--strong-text)" }}
            >
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <ProfileMenu isAuthenticated={isAuthenticated} isAdmin={isAdmin} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
