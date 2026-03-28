import Link from "next/link";
import { SmoothStickyPanel } from "@/components/layout/smooth-sticky-panel";
import { getBoardNavigation } from "@/lib/board-navigation";

type SideNavigationVariant = "default" | "hub";

type SideNavigationProps = {
  variant?: SideNavigationVariant;
};

export async function SideNavigation({ variant = "default" }: SideNavigationProps = {}) {
  const { items, source } = await getBoardNavigation();

  if (variant === "hub") {
    return (
      <SmoothStickyPanel className="hidden w-[280px] shrink-0 self-start md:sticky md:top-24 md:block">
        <aside
          className="hub-floating-panel relative border p-4 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto"
          style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}
        >
          <Link
            href="/lounge"
            className="hub-floating-link mb-4 block border-l-2 px-3 py-3"
            style={{
              borderColor: "var(--hub-accent)",
              backgroundColor: "var(--hub-surface-alt)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Communication Nodes
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--hub-muted)" }}>
              {source === "db" ? "게시판 네비게이션" : "가데이터 네비게이션 (DB 미연동)"}
            </p>
          </Link>

          <nav className="space-y-[1px]" style={{ backgroundColor: "var(--hub-border)" }}>
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/board/${item.slug}`}
                className="hub-floating-link block border-l-2 px-3 py-3"
                style={{
                  borderColor: "transparent",
                  backgroundColor: "var(--hub-surface)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--hub-text)" }}>
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--hub-muted)" }}>
                    {item.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </nav>
        </aside>
      </SmoothStickyPanel>
    );
  }

  return (
    <aside className="theme-panel hidden w-[260px] shrink-0 self-start rounded-2xl border p-4 backdrop-blur-sm md:sticky md:top-24 md:block md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <Link
        href="/lounge"
        className="mb-4 block rounded-xl border p-3 transition hover:opacity-90"
        style={{ borderColor: "var(--chip-border)", backgroundColor: "var(--chip-bg)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          Community Navigation
        </p>
        <p className="theme-text-muted mt-1 text-xs">
          {source === "db"
            ? "DB 연동 메뉴 (클릭 시 라운지 이동)"
            : "DB 데이터가 없어 가데이터로 동작 중 (클릭 시 라운지 이동)"}
        </p>
      </Link>

      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/board/${item.slug}`}
            className="block rounded-xl border px-3 py-2 text-sm transition hover:opacity-90"
            style={{
              borderColor: "transparent",
              backgroundColor: "var(--surface-soft)",
              color: "var(--strong-text)",
            }}
          >
            <p className="font-semibold">{item.title}</p>
            {item.description ? <p className="theme-text-muted mt-0.5 text-xs">{item.description}</p> : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
