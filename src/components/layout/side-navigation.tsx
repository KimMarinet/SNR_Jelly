import Link from "next/link";
import { getBoardNavigation } from "@/lib/board-navigation";

export async function SideNavigation() {
  const { items, source } = await getBoardNavigation();

  return (
    <aside className="hidden w-[260px] shrink-0 rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm md:block">
      <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          Community Navigation
        </p>
        <p className="mt-1 text-xs text-zinc-200">
          {source === "db"
            ? "DB 동기화 메뉴"
            : "DB 데이터가 없어 가데이터로 동작 중"}
        </p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/board/${item.slug}`}
            className="block rounded-xl border border-transparent bg-white/5 px-3 py-2 text-sm text-zinc-100 transition hover:border-amber-300/40 hover:bg-white/10"
          >
            <p className="font-semibold">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-xs text-zinc-300">{item.description}</p>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
