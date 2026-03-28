"use client";

import { useState } from "react";

export type CombinationItem = {
  id: string;
  rank: number;
  name: string;
  combinationCount: number;
  battleCount: number;
  successRate: number;
  statusLabel: string;
  summary: string;
  details: string;
};

type CombinationSectionProps = {
  items?: CombinationItem[];
  generatedLabel?: string;
};

const DEFAULT_ITEMS: CombinationItem[] = [
  {
    id: "combination-1",
    rank: 1,
    name: "\uC870\uD569 \uC900\uBE44 A",
    combinationCount: 7,
    battleCount: 22,
    successRate: 40.9,
    statusLabel: "\uC5F0\uB3D9 \uB300\uAE30",
    summary: "\uC0C1\uC138 \uB370\uC774\uD130\uB97C \uC5F0\uACB0\uD558\uBA74 \uB300\uD45C \uC870\uD569 \uC124\uBA85\uC774 \uC774 \uC704\uCE58\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
    details:
      "\uC5EC\uAE30\uC5D0 \uD575\uC2EC \uCE90\uB9AD\uD130 \uAD6C\uC131, \uC6B4\uC601 \uC21C\uC11C, \uAC15\uC810\uACFC \uC57D\uC810 \uAC19\uC740 \uC138\uBD80 \uC124\uBA85\uC744 \uB123\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  },
  {
    id: "combination-2",
    rank: 2,
    name: "\uC870\uD569 \uC900\uBE44 B",
    combinationCount: 7,
    battleCount: 16,
    successRate: 31.3,
    statusLabel: "\uC5F0\uB3D9 \uB300\uAE30",
    summary: "\uC678\uBD80 \uC9D1\uACC4 \uB370\uC774\uD130\uB098 \uC9C1\uC811 \uC785\uB825\uD55C \uD1B5\uACC4\uB97C \uC774 \uCE74\uB4DC\uC5D0 \uC5F0\uACB0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    details:
      "\uD3BC\uCE68 \uD328\uB110\uC5D0\uB294 \uC2B9\uB960 \uCD94\uC774, \uCD94\uCC9C \uC7A5\uBE44, \uB300\uCCB4 \uD53D \uB4F1 \uD544\uC694\uD55C \uC124\uBA85\uC744 \uC790\uC720\uB86D\uAC8C \uD655\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  },
  {
    id: "combination-3",
    rank: 3,
    name: "\uC870\uD569 \uC900\uBE44 C",
    combinationCount: 4,
    battleCount: 13,
    successRate: 23.1,
    statusLabel: "\uC5F0\uB3D9 \uB300\uAE30",
    summary: "\uD589 \uB2E8\uC704 \uB370\uC774\uD130\uB9CC \uB123\uC73C\uBA74 \uD604\uC7AC \uB808\uC774\uC544\uC6C3\uC744 \uC720\uC9C0\uD55C \uCC44 \uBAA9\uB85D\uC774 \uB80C\uB354\uB9C1\uB429\uB2C8\uB2E4.",
    details:
      "\uD604\uC7AC \uAD6C\uC131\uC740 \uB7AD\uD0B9, \uC870\uD569\uBA85, \uC870\uD569 \uC218, \uC804\uD22C \uC218, \uC131\uACF5\uB960, \uC0C1\uC138 \uC124\uBA85 \uD328\uB110\uC744 \uD3EC\uD568\uD569\uB2C8\uB2E4.",
  },
  {
    id: "combination-4",
    rank: 4,
    name: "\uC870\uD569 \uC900\uBE44 D",
    combinationCount: 3,
    battleCount: 12,
    successRate: 41.7,
    statusLabel: "\uC5F0\uB3D9 \uB300\uAE30",
    summary: "\uC911\uD558\uB2E8 \uD589\uB3C4 \uAC19\uC740 \uD328\uD134\uC73C\uB85C \uBC18\uBCF5\uB418\uBA70 \uBAA8\uBC14\uC77C\uC5D0\uC11C\uB3C4 \uC811\uD798 \uB3D9\uC791\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4.",
    details:
      "\uC0C1\uC138 \uD328\uB110\uC740 \uAC01 \uD589 \uC544\uB798\uC5D0 \uBC14\uB85C \uC5F4\uB824\uC11C \uC0AC\uC6A9\uC790\uAC00 \uB9E5\uB77D\uC744 \uC783\uC9C0 \uC54A\uACE0 \uD655\uC778\uD560 \uC218 \uC788\uB3C4\uB85D \uAD6C\uC131\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
  },
  {
    id: "combination-5",
    rank: 5,
    name: "\uC870\uD569 \uC900\uBE44 E",
    combinationCount: 3,
    battleCount: 12,
    successRate: 41.7,
    statusLabel: "\uC5F0\uB3D9 \uB300\uAE30",
    summary: "\uC784\uC2DC \uB370\uC774\uD130\uB294 \uB098\uC911\uC5D0 \uC2E4\uC81C \uC870\uD569 \uC815\uBCF4\uB85C \uC190\uC27D\uAC8C \uAD50\uCCB4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    details:
      "\uCD94\uD6C4 \uCE90\uB9AD\uD130 \uC378\uB124\uC77C, \uD544\uD130, \uC815\uB82C \uAE30\uC900, \uAE30\uAC04 \uC120\uD0DD\uC744 \uCD94\uAC00\uD558\uB294 \uD655\uC7A5 \uC791\uC5C5\uB3C4 \uC26C\uC6B4 \uAD6C\uC870\uC785\uB2C8\uB2E4.",
  },
];

function getRankAccent(rank: number): string {
  if (rank === 1) return "color-mix(in srgb, var(--hub-accent) 60%, #ff8e4d 40%)";
  if (rank === 2) return "color-mix(in srgb, var(--hub-accent) 40%, #7b73c8 60%)";
  if (rank === 3) return "color-mix(in srgb, var(--hub-accent) 30%, #8b5a4a 70%)";
  return "var(--hub-border)";
}

export function CombinationSection({
  items = DEFAULT_ITEMS,
}: CombinationSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const visibleItems = items.slice(0, 3);

  return (
    <section>
      <div className="mb-8 flex items-center gap-4">
        <h2
          className="text-2xl font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-accent)" }}
        >
          Combination
        </h2>
        <div
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--hub-accent) 30%, transparent) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="flex flex-col gap-[1px]" style={{ backgroundColor: "var(--hub-border)" }}>
        {visibleItems.map((item) => {
          const isOpen = openId === item.id;
          const rankAccent = getRankAccent(item.rank);

          return (
            <div
              key={item.id}
              className="overflow-hidden border-l-2"
              style={{
                borderColor: rankAccent,
                backgroundColor: "var(--hub-surface)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                className="flex w-full items-center gap-4 px-5 py-3 text-left transition"
                aria-expanded={isOpen}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black [font-family:var(--font-space-grotesk),sans-serif]"
                  style={{ color: rankAccent }}
                >
                  {item.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight" style={{ color: "var(--hub-text)" }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--hub-muted)" }}>
                    {`${item.combinationCount}\uAC1C \uC870\uD569`}
                  </p>
                </div>

                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center transition-transform"
                  style={{
                    color: "var(--hub-muted)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  aria-hidden
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {isOpen ? (
                <div
                  className="border-t px-5 pb-4 pt-3"
                  style={{
                    borderColor: "var(--hub-border)",
                    backgroundColor: "var(--hub-surface-alt)",
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--hub-accent)" }}>
                    {"\uC0C1\uC138 \uC124\uBA85"}
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: "var(--hub-text)" }}>
                    {item.details}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
