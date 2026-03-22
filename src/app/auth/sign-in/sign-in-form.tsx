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
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="비밀번호"
        required
        className="w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm text-white outline-none"
      />
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
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
