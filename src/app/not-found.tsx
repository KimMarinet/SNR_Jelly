import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-rose-300/40 bg-rose-300/10 p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-200">
        Navigation Error
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">
        요청한 게시판을 찾을 수 없습니다.
      </h1>
      <p className="mt-2 text-sm text-zinc-100">
        경로가 올바른지 확인한 뒤 다시 시도해 주세요.
      </p>
      <Link
        href="/lounge"
        className="mt-5 inline-block rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        라운지로 이동
      </Link>
    </div>
  );
}
