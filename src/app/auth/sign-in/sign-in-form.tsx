"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  callbackUrl: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setSubmitting(false);
      return;
    }

    window.location.href = result.url || callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="sign-in-email"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hub-muted)] [font-family:var(--font-space-grotesk),sans-serif]"
        >
          Email
        </label>
        <input
          id="sign-in-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일을 입력해 주세요"
          required
          className="w-full rounded-2xl border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg)_42%,var(--hub-surface)_58%)] px-4 py-3 text-sm text-[var(--hub-text)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--hub-muted)_72%,transparent)] focus:border-[var(--hub-outline)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hub-accent)_16%,transparent)]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="sign-in-password"
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hub-muted)] [font-family:var(--font-space-grotesk),sans-serif]"
        >
          Password
        </label>
        <input
          id="sign-in-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호를 입력해 주세요"
          required
          className="w-full rounded-2xl border border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-bg)_42%,var(--hub-surface)_58%)] px-4 py-3 text-sm text-[var(--hub-text)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--hub-muted)_72%,transparent)] focus:border-[var(--hub-outline)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--hub-accent)_16%,transparent)]"
        />
      </div>

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
        <span className="auth-neon-button__label">{submitting ? "로그인 중..." : "로그인"}</span>
      </button>
    </form>
  );
}
