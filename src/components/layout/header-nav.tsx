"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderVariant = "default" | "hub";

type HeaderMenu = {
  href: string;
  label: string;
};

type HeaderNavProps = {
  menus: HeaderMenu[];
  variant: HeaderVariant;
};

function isMenuActive(pathname: string, href: string) {
  if (href === "/lounge") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({ menus, variant }: HeaderNavProps) {
  const pathname = usePathname();
  const isHub = variant === "hub";

  return (
    <nav className={isHub ? "hidden items-center gap-6 md:flex" : "theme-chip hidden items-center gap-2 rounded-full border p-1 md:flex"}>
      {menus.map((menu, index) => {
        const active = isHub && pathname ? isMenuActive(pathname, menu.href) : index === 0;

        return (
          <Link
            key={`${menu.label}-${index}`}
            href={menu.href}
            className={
              isHub
                ? "border-b-2 pb-1 text-sm font-bold uppercase tracking-wide transition"
                : "rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-90"
            }
            style={
              isHub
                ? active
                  ? { color: "var(--hub-accent)", borderColor: "var(--hub-accent)" }
                  : { color: "color-mix(in srgb, var(--hub-text) 70%, transparent)", borderColor: "transparent" }
                : { color: "var(--strong-text)" }
            }
          >
            {menu.label}
          </Link>
        );
      })}
    </nav>
  );
}
