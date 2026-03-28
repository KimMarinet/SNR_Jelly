import Link from "next/link";
import { getServerSession } from "next-auth";
import { HeaderNav } from "@/components/layout/header-nav";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { authOptions } from "@/lib/auth";

const GLOBAL_MENUS = [
  { href: "/lounge", label: "커뮤니티" },
  { href: "/lounge", label: "도감" },
  { href: "/lounge", label: "고객센터" },
];

const HUB_MENUS = [
  { href: "/lounge", label: "Lounge" },
  { href: "/board/notice", label: "Notice" },
];

type HeaderVariant = "default" | "hub";

type HeaderProps = {
  variant?: HeaderVariant;
};

export async function Header({ variant = "default" }: HeaderProps = {}) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user?.id);
  const isAdmin = session?.user?.role === "ADMIN";
  const displayName = session?.user?.nickname ?? session?.user?.name ?? session?.user?.email;
  const isHub = variant === "hub";
  const menus = isHub ? HUB_MENUS : GLOBAL_MENUS;

  return (
    <header
      className={
        isHub
          ? "border-b backdrop-blur-md"
          : "theme-border theme-elevated border-b backdrop-blur-md"
      }
      style={
        isHub
          ? {
              borderColor: "var(--hub-border)",
              backgroundColor: "color-mix(in srgb, var(--hub-bg) 92%, transparent)",
            }
          : undefined
      }
    >
      <div
        className={[
          "mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 md:px-6",
          isHub ? "max-w-[1440px]" : "max-w-[1400px]",
        ].join(" ")}
      >
        <Link
          href="/lounge"
          className={
            isHub
              ? "text-xl font-black italic tracking-tight md:text-2xl [font-family:var(--font-space-grotesk),sans-serif]"
              : "brand-heading theme-text-strong text-xl md:text-2xl"
          }
          style={isHub ? { color: "var(--hub-accent)" } : undefined}
        >
          {isHub ? "SNR Jelly" : "세븐나이츠 리버스 라운지"}
        </Link>

        <HeaderNav menus={menus} variant={variant} />

        <div className="flex items-center gap-2 text-sm">
          <ProfileMenu
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            displayName={displayName}
            variant={variant}
          />
        </div>
      </div>
    </header>
  );
}
