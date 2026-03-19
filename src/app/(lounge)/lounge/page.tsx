import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "세븐나이츠 리버스 라운지 허브",
  description: "공지, 공략, 트렌드를 확인하는 메인 라운지",
};

const BRIEFING_CARDS = [
  {
    label: "필독 공지사항",
    title: "3월 3주차 업데이트 점검 안내",
    summary: "점검 일정, 신규 콘텐츠 해금 조건, 임시 제한 사항을 반드시 확인하세요.",
  },
  {
    label: "금주의 베스트 공략",
    title: "무과금 기준 루나 장비 세팅 최적화",
    summary: "장비 우선순위와 특성 분배 수치를 실제 전투 로그 기반으로 정리했습니다.",
  },
  {
    label: "핫 트렌드 게시글",
    title: "심연 보스 7턴 클리어 조합 공유",
    summary: "핵심 딜 사이클과 대체 영웅 조합을 댓글에서 실시간 업데이트 중입니다.",
  },
];

const EXTERNAL_LINKS = [
  { href: "https://forum.netmarble.com/sknightsm", label: "공식 포럼 바로가기" },
  { href: "https://www.netmarble.com/ko", label: "게임 다운로드" },
  { href: "https://www.youtube.com", label: "공식 영상 채널" },
];

export default function LoungeHomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_top_right,#f59e0b33,transparent_40%),linear-gradient(150deg,#0b1226_0%,#111827_45%,#1d2233_100%)] p-6 md:p-10">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-36 w-36 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Handler One Briefing
          </p>
          <h1 className="brand-heading mt-3 text-3xl leading-tight text-white md:text-5xl">
            세븐나이츠 리버스 공략 작전 거점
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200 md:text-base">
            전장 정보가 흩어지지 않도록 핵심 공략을 한곳에 집결시켰습니다. 오늘의
            공지, 추천 공략, 실시간 트렌드를 빠르게 확인하고 스쿼드 전력에
            반영하세요.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/board/notice"
              className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              필독 공지 확인
            </Link>
            <Link
              href="/board/strategy"
              className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              베스트 공략 보러가기
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white md:text-2xl">주요 정보 브리핑</h2>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            실시간 업데이트 예정
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {BRIEFING_CARDS.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-white/15 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-white/10"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                {card.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{card.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-gradient-to-r from-slate-900/60 via-slate-800/50 to-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">외부 통신 연결구</h2>
        <p className="mt-1 text-sm text-zinc-200">
          공식 채널과 다운로드 허브를 통해 최신 소식을 계속 동기화하세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-amber-300/50 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
