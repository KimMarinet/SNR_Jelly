"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message ?? "관리자 인증에 실패했습니다.");
      }

      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "인증 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
    <section className="w-full max-w-lg rounded-2xl border border-amber-300/35 bg-black/45 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
        관리자 접근
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white">관리자 인증 필요</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-200">
        운영 패널 접근을 위해 관리자 비밀번호를 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <label className="block text-sm font-medium text-zinc-100" htmlFor="admin-password">
          관리자 비밀번호
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
          placeholder="비밀번호 입력"
          required
        />

        {error ? (
          <p className="rounded-md border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:from-emerald-200 hover:to-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "인증 중..." : "관리자 로그인"}
        </button>
      </form>
    </section>
    </div>
  );
}
