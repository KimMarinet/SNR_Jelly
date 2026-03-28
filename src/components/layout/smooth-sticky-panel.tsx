"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";

export function SmoothStickyPanel({
  className,
  children,
  style,
}: Readonly<{
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const offsetYRef = useRef(0);
  const targetYRef = useRef(0);
  const lastScrollYRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function applyTransform() {
      if (!rootRef.current) {
        return;
      }

      rootRef.current.style.transform = `translate3d(0, ${offsetYRef.current.toFixed(2)}px, 0)`;
    }

    function stopAnimation() {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }

    function reset() {
      stopAnimation();
      offsetYRef.current = 0;
      targetYRef.current = 0;
      lastScrollYRef.current = window.scrollY;
      applyTransform();
    }

    function animate() {
      offsetYRef.current += (targetYRef.current - offsetYRef.current) * 0.2;
      targetYRef.current *= 0.8;
      applyTransform();

      if (
        Math.abs(offsetYRef.current) < 0.05 &&
        Math.abs(targetYRef.current) < 0.05
      ) {
        offsetYRef.current = 0;
        targetYRef.current = 0;
        applyTransform();
        frameRef.current = null;
        return;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    }

    function scheduleAnimation() {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    }

    function handleScroll() {
      if (!mediaQuery.matches || reducedMotionQuery.matches) {
        return;
      }

      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current ?? currentScrollY;
      const delta = currentScrollY - previousScrollY;
      lastScrollYRef.current = currentScrollY;

      targetYRef.current = Math.max(-16, Math.min(16, delta * 0.28));
      scheduleAnimation();
    }

    function handleModeChange() {
      reset();
    }

    reset();
    window.addEventListener("scroll", handleScroll, { passive: true });
    mediaQuery.addEventListener("change", handleModeChange);
    reducedMotionQuery.addEventListener("change", handleModeChange);

    return () => {
      stopAnimation();
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", handleModeChange);
      reducedMotionQuery.removeEventListener("change", handleModeChange);
    };
  }, []);

  return (
    <div ref={rootRef} className={className ? `hub-floating-inner ${className}` : "hub-floating-inner"} style={style}>
      {children}
    </div>
  );
}
