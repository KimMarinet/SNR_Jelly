"use client";

/**
 * SlashTransition
 * 랜딩 페이지에서 마우스/터치로 대각선 검기 제스처를 하면
 * 화면이 두 조각으로 갈라지며 목표 경로로 이동합니다.
 *
 * 판정 조건:
 *   - 이동 거리  ≥ 120 px
 *   - 속도       ≥ 0.35 px/ms
 *   - 각도       17° ~ 73° (대각선 범위)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Point {
  x: number;
  y: number;
}

type Phase = "idle" | "drawing" | "flash" | "splitting";

const BG = "#080b16"; // 랜딩 페이지 배경색과 동일

export function SlashTransition({ to = "/lounge" }: { to?: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const startRef = useRef<{ p: Point; t: number } | null>(null);
  const trailRef = useRef<Point[]>([]);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [splitPolys, setSplitPolys] = useState<{ tl: string; br: string } | null>(null);
  const [atHero, setAtHero] = useState(true);

  // 히어로 섹션 범위 안에서만 힌트 표시
  useEffect(() => {
    const onScroll = () => {
      setAtHero(window.scrollY < window.innerHeight * 0.75);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── 캔버스 크기 유지 ──────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── 트레일 렌더링 ─────────────────────────────────────
  const drawTrail = useCallback((points: Point[], flashAlpha = 0) => {
    const c = canvasRef.current;
    if (!c || points.length < 2) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    const first = points[0];
    const last = points[points.length - 1];

    // 외곽 글로우
    ctx.save();
    ctx.strokeStyle = "rgba(100, 210, 255, 0.18)";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    // 내부 글로우
    ctx.save();
    ctx.strokeStyle = "rgba(180, 235, 255, 0.35)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    // 코어 라인 (그라디언트)
    const grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
    grad.addColorStop(0, "rgba(150, 220, 255, 0.05)");
    grad.addColorStop(0.4, "rgba(200, 235, 255, 0.7)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.98)");
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();

    // 플래시 오버레이
    if (flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(210, 245, 255, ${flashAlpha * 0.45})`;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.restore();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, []);

  // ── 참격 확정 처리 ────────────────────────────────────
  const onSlashConfirmed = useCallback(
    (start: Point, end: Point) => {
      const W = window.innerWidth;
      const H = window.innerHeight;

      // 화면 분할 폴리곤 계산 (슬래시 선을 기준으로 위·아래)
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const len = Math.sqrt(W * W + H * H) * 1.6;

      const ax = mx - cos * len;
      const ay = my - sin * len;
      const bx = mx + cos * len;
      const by = my + sin * len;

      const tl = `polygon(${ax}px ${ay}px, ${bx}px ${by}px, ${W + 300}px ${-300}px, ${-300}px ${-300}px)`;
      const br = `polygon(${ax}px ${ay}px, ${bx}px ${by}px, ${W + 300}px ${H + 300}px, ${-300}px ${H + 300}px)`;

      setSplitPolys({ tl, br });

      // 플래시 → 분할 → 이동
      phaseRef.current = "flash";
      setPhase("flash");

      let alpha = 1.0;
      const flash = () => {
        alpha -= 0.07;
        if (alpha > 0) {
          drawTrail(trailRef.current, alpha);
          rafRef.current = requestAnimationFrame(flash);
        } else {
          clearCanvas();
          phaseRef.current = "splitting";
          setPhase("splitting");
          setTimeout(() => router.push(to), 680);
        }
      };
      rafRef.current = requestAnimationFrame(flash);
    },
    [drawTrail, clearCanvas, router, to],
  );

  // ── document 포인터 이벤트 ───────────────────────────
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (phaseRef.current !== "idle") return;
      startRef.current = { p: { x: e.clientX, y: e.clientY }, t: Date.now() };
      trailRef.current = [{ x: e.clientX, y: e.clientY }];
      phaseRef.current = "drawing";
      setPhase("drawing");
    };

    const onMove = (e: PointerEvent) => {
      if (phaseRef.current !== "drawing") return;
      e.preventDefault(); // 텍스트 선택·브라우저 기본 드래그 방지
      trailRef.current = [...trailRef.current, { x: e.clientX, y: e.clientY }];
      drawTrail(trailRef.current);
    };

    const onUp = (e: PointerEvent) => {
      if (phaseRef.current !== "drawing" || !startRef.current) return;

      const start = startRef.current.p;
      const end: Point = { x: e.clientX, y: e.clientY };
      const elapsed = Math.max(Date.now() - startRef.current.t, 1);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / elapsed; // px/ms
      const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)));
      const isDiagonal = angle > 0.3 && angle < 1.27; // ~17° ~ ~73°

      if (dist >= 120 && speed >= 0.35 && isDiagonal) {
        onSlashConfirmed(start, end);
      } else {
        phaseRef.current = "idle";
        setPhase("idle");
        clearCanvas();
        trailRef.current = [];
      }
      startRef.current = null;
    };

    document.addEventListener("pointerdown", onDown);
    // passive: false → pointermove 에서 preventDefault() 호출 가능 (드래그 선택 방지)
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp as EventListener);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp as EventListener);
    };
  }, [drawTrail, clearCanvas, onSlashConfirmed]);

  return (
    <>
      {/* 슬래시 트레일 캔버스 */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[60]"
        aria-hidden
      />

      {/* 화면 분할 패널 */}
      {phase === "splitting" && splitPolys && (
        <>
          {/* 위쪽 조각 → 좌상단으로 이탈 */}
          <div
            className="pointer-events-none fixed inset-0 z-[55]"
            style={{
              clipPath: splitPolys.tl,
              backgroundColor: BG,
              animation: "slash-split-tl 0.68s cubic-bezier(0.25, 0, 0.75, 1) forwards",
            }}
            aria-hidden
          />
          {/* 아래쪽 조각 → 우하단으로 이탈 */}
          <div
            className="pointer-events-none fixed inset-0 z-[55]"
            style={{
              clipPath: splitPolys.br,
              backgroundColor: BG,
              animation: "slash-split-br 0.68s cubic-bezier(0.25, 0, 0.75, 1) forwards",
            }}
            aria-hidden
          />
        </>
      )}

      {/* 대기 상태 힌트 UI — 히어로 섹션 안에서만 표시 */}
      {phase === "idle" && atHero && (
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 z-[40] -translate-x-1/2 -translate-y-1/2 select-none transition-opacity duration-500"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-2 opacity-60">
            <svg width="48" height="2" viewBox="0 0 48 2" fill="none">
              <line
                x1="0" y1="1" x2="48" y2="1"
                stroke="url(#hint-line)"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="hint-line" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#67e8f9" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200">
              ⚔ 검을 그어 작전 개시
            </p>
            <svg width="48" height="2" viewBox="0 0 48 2" fill="none">
              <line
                x1="0" y1="1" x2="48" y2="1"
                stroke="url(#hint-line2)"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="hint-line2" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#67e8f9" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
