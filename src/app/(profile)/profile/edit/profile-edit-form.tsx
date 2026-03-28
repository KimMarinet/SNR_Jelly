"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";

type ProfileEditFormProps = {
  initialEmail: string;
  initialNickname: string;
};

type UpdateResponse = {
  message?: string;
  user?: {
    nickname: string;
  };
};

type VerifyResponse = {
  message?: string;
};

export function ProfileEditForm({ initialEmail, initialNickname }: ProfileEditFormProps) {
  const { update } = useSession();
  const [nickname, setNickname] = useState(initialNickname);
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [verifyingCurrentPassword, setVerifyingCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onVerifyCurrentPassword() {
    if (!currentPassword) {
      setError("현재 비밀번호를 입력해 주세요.");
      return;
    }

    setVerifyingCurrentPassword(true);
    setError(null);
    setVerificationMessage(null);

    try {
      const response = await fetch("/api/profile/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as VerifyResponse;
      if (!response.ok) {
        throw new Error(data.message ?? "현재 비밀번호 확인에 실패했습니다.");
      }

      setCurrentPasswordVerified(true);
      setVerificationMessage(data.message ?? "현재 비밀번호 확인이 완료되었습니다.");
    } catch (caught) {
      setCurrentPasswordVerified(false);
      setError(caught instanceof Error ? caught.message : "현재 비밀번호 확인에 실패했습니다.");
    } finally {
      setVerifyingCurrentPassword(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 24) {
      setError("닉네임은 2자 이상 24자 이하로 입력해 주세요.");
      setSubmitting(false);
      return;
    }

    if (!currentPasswordVerified) {
      setError("저장 전에 현재 비밀번호 확인을 완료해 주세요.");
      setSubmitting(false);
      return;
    }

    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: trimmedNickname,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as UpdateResponse;
      if (!response.ok) {
        throw new Error(data.message ?? "프로필 정보를 저장하지 못했습니다.");
      }

      setMessage(data.message ?? "프로필 정보가 저장되었습니다.");
      setCurrentPassword("");
      setCurrentPasswordVerified(false);
      setVerificationMessage(null);
      setNewPassword("");
      setConfirmPassword("");

      if (data.user?.nickname) {
        await update({ nickname: data.user.nickname });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "프로필 정보를 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label
          htmlFor="email"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={initialEmail}
          disabled
          className="w-full border px-3 py-2 text-sm opacity-75 outline-none"
          style={{
            borderColor: "var(--hub-border)",
            backgroundColor: "var(--hub-surface-alt)",
            color: "var(--hub-muted)",
          }}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="nickname"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          Nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          minLength={2}
          maxLength={24}
          required
          className="w-full border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--hub-border)",
            backgroundColor: "color-mix(in srgb, var(--hub-bg) 44%, var(--hub-surface) 56%)",
            color: "var(--hub-text)",
          }}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="current-password"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          Current Password
        </label>
        <div className="flex gap-2">
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              if (!currentPasswordVerified) {
                setVerificationMessage(null);
              }
            }}
            required
            disabled={currentPasswordVerified || verifyingCurrentPassword || submitting}
            placeholder="저장을 위해 현재 비밀번호를 입력해 주세요."
            className="w-full border px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--hub-border)",
              backgroundColor: "color-mix(in srgb, var(--hub-bg) 44%, var(--hub-surface) 56%)",
              color: "var(--hub-text)",
            }}
          />
          <button
            type="button"
            onClick={onVerifyCurrentPassword}
            disabled={
              currentPasswordVerified ||
              verifyingCurrentPassword ||
              submitting ||
              currentPassword.length === 0
            }
            className="shrink-0 border px-3 py-2 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--hub-outline)",
              backgroundColor: "var(--hub-accent-soft)",
              color: "var(--hub-accent)",
            }}
          >
            {currentPasswordVerified
              ? "Verified"
              : verifyingCurrentPassword
                ? "Checking..."
                : "Verify"}
          </button>
        </div>
        {verificationMessage ? (
          <p className="text-xs" style={{ color: "var(--hub-accent)" }}>
            {verificationMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="new-password"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          placeholder="변경하지 않으려면 비워 두세요."
          className="w-full border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--hub-border)",
            backgroundColor: "color-mix(in srgb, var(--hub-bg) 44%, var(--hub-surface) 56%)",
            color: "var(--hub-text)",
          }}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="confirm-password"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          placeholder="새 비밀번호를 한 번 더 입력해 주세요."
          className="w-full border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--hub-border)",
            backgroundColor: "color-mix(in srgb, var(--hub-bg) 44%, var(--hub-surface) 56%)",
            color: "var(--hub-text)",
          }}
        />
      </div>

      {message ? (
        <p className="border px-3 py-2 text-sm" style={{ borderColor: "var(--hub-outline)", color: "var(--hub-text)", backgroundColor: "var(--hub-accent-soft)" }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border px-3 py-2 text-sm" style={{ borderColor: "var(--hub-danger-border)", color: "var(--hub-danger-text)", backgroundColor: "var(--hub-danger-bg)" }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center rounded-[4px] px-4 py-2 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--hub-accent-button-bg)", color: "var(--hub-accent-button-text)" }}
      >
        {submitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
