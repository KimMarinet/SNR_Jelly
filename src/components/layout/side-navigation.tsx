import Link from "next/link";
import { getBoardNavigation } from "@/lib/board-navigation";

export async function SideNavigation() {
  const { items, source } = await getBoardNavigation();

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
            {item.description ? (
              <p className="theme-text-muted mt-0.5 text-xs">{item.description}</p>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
