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

      setMessage("가입이 완료되었습니다. 로그인 처리 중입니다...");
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="sign-up-email"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hub-muted)] [font-family:var(--font-space-grotesk),sans-serif]"
        >
          Email
        </label>
        <input
          id="sign-up-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="사용할 이메일을 입력해 주세요"
          required
          className="w-full rounded-2xl border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg)_42%,var(--hub-surface)_58%)] px-4 py-3 text-sm text-[var(--hub-text)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--hub-muted)_72%,transparent)] focus:border-[var(--hub-outline)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hub-accent)_16%,transparent)]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="sign-up-nickname"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hub-muted)] [font-family:var(--font-space-grotesk),sans-serif]"
        >
          Nickname
        </label>
        <input
          id="sign-up-nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="커뮤니티에서 사용할 닉네임"
          minLength={2}
          maxLength={24}
          required
          className="w-full rounded-2xl border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg)_42%,var(--hub-surface)_58%)] px-4 py-3 text-sm text-[var(--hub-text)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--hub-muted)_72%,transparent)] focus:border-[var(--hub-outline)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hub-accent)_16%,transparent)]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="sign-up-password"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hub-muted)] [font-family:var(--font-space-grotesk),sans-serif]"
        >
          Password
        </label>
        <input
          id="sign-up-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8자 이상 비밀번호"
          minLength={8}
          required
          className="w-full rounded-2xl border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg)_42%,var(--hub-surface)_58%)] px-4 py-3 text-sm text-[var(--hub-text)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--hub-muted)_72%,transparent)] focus:border-[var(--hub-outline)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hub-accent)_16%,transparent)]"
        />
      </div>

      {message ? (
        <p className="rounded-2xl border border-[var(--hub-outline)] bg-[var(--hub-accent-soft)] px-4 py-3 text-sm text-[var(--hub-text)]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-[var(--hub-danger-border)] bg-[var(--hub-danger-bg)] px-4 py-3 text-sm text-[var(--hub-danger-text)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="auth-neon-button w-full rounded-2xl bg-[var(--hub-accent-button-bg)] px-4 py-3 text-sm font-bold tracking-[0.08em] text-[#243200] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="auth-neon-button__label">{submitting ? "가입 중..." : "회원가입"}</span>
      </button>
    </form>
  );
}
