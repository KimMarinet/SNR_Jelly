"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "회원가입에 실패했습니다.");
      }

      setMessage("가입이 완료되었습니다. 로그인 중입니다...");
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/lounge",
      });

      if (!signInResult || signInResult.error) {
        window.location.href = "/auth/sign-in";
        return;
      }

      window.location.href = signInResult.url || "/lounge";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="이메일"
        required
        className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
      />
      <input
        type="text"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder="닉네임"
        minLength={2}
        maxLength={24}
        required
        className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="비밀번호 (8자 이상)"
        minLength={8}
        required
        className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
      />

      {message ? (
        <p className="rounded-lg border border-emerald-300/35 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "가입 중..." : "회원가입"}
      </button>
    </form>
  );
}
