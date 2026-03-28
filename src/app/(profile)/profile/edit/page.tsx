import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditForm } from "./profile-edit-form";

export const metadata = {
  title: "Profile Settings",
  description: "계정 정보를 확인하고 관리할 수 있는 페이지입니다.",
};

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect("/auth/sign-in?callbackUrl=/profile/edit");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      nickname: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/profile/edit");
  }

  const joinedAt = user.createdAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Member";
  const displayName = user.nickname?.trim() || user.email.split("@")[0] || "알 수 없음";

  return (
    <div className="space-y-6 md:space-y-8">
      <header
        className="relative overflow-hidden border p-6 md:p-8"
        style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--hub-accent) 20%, transparent), transparent 42%), radial-gradient(circle at 80% 85%, color-mix(in srgb, var(--hub-hero-glow-b) 95%, transparent), transparent 36%)",
          }}
          aria-hidden
        />
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full"
                style={{ backgroundColor: "var(--hub-accent)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--hub-accent)" }}
              />
            </span>
            <p
              className="text-[10px] uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Terminal / Profile Control
            </p>
          </div>

          <h1
            className="text-4xl font-black uppercase leading-none tracking-tight md:text-6xl [font-family:var(--font-space-grotesk),sans-serif]"
            style={{ color: "var(--hub-text)" }}
          >
            Account{" "}
            <span className="text-transparent" style={{ WebkitTextStroke: "1px var(--hub-accent)" }}>
              Settings
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: "var(--hub-muted)" }}>
            이 페이지에서 닉네임과 비밀번호를 수정할 수 있습니다.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article
          className="border lg:col-span-7"
          style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}
        >
          <div
            className="border-b px-5 py-4 md:px-6"
            style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface-alt)" }}
          >
            <h2
              className="text-lg font-bold uppercase tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Edit Profile
            </h2>
          </div>
          <div className="space-y-4 p-5 md:p-6">
            <p className="text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>
              이메일은 보안을 위해 수정할 수 없으며 닉네임과 비밀번호만 변경할 수 있습니다.
            </p>
            <ProfileEditForm initialEmail={user.email} initialNickname={user.nickname} />
          </div>
        </article>

        <aside className="space-y-4 lg:col-span-5">
          <div
            className="border p-5"
            style={{
              borderColor: "var(--hub-outline)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--hub-accent-soft) 74%, transparent) 0%, color-mix(in srgb, var(--hub-surface-alt) 92%, transparent) 100%)",
            }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.16em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-accent)" }}
            >
              Active Operator
            </p>
            <p
              className="mt-2 text-2xl font-bold tracking-tight [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-text)" }}
            >
              {displayName}
            </p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--hub-muted)" }}>
              계정 정보를 항상 최신 상태로 유지해 주세요.
            </p>
          </div>

          <div className="border p-5" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}>
            <h3
              className="text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-muted)" }}
            >
              Account Snapshot
            </h3>
            <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--hub-text)" }}>
              <p>Role: {roleLabel}</p>
              <p>Joined: {joinedAt}</p>
            </div>
          </div>

          <div className="border p-5" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface-alt)" }}>
            <h3
              className="text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-space-grotesk),sans-serif]"
              style={{ color: "var(--hub-muted)" }}
            >
              Quick Access
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/lounge"
                className="inline-flex items-center rounded-[4px] px-4 py-2 text-xs font-bold uppercase tracking-wide transition"
                style={{ background: "var(--hub-accent-button-bg)", color: "var(--hub-accent-button-text)" }}
              >
                Go Lounge
              </Link>
              <Link
                href="/board/notice"
                className="inline-flex items-center rounded-[4px] border px-4 py-2 text-xs font-bold uppercase tracking-wide transition"
                style={{
                  borderColor: "var(--hub-outline)",
                  backgroundColor: "var(--hub-accent-soft)",
                  color: "var(--hub-accent)",
                }}
              >
                View Notice
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="border p-5 md:p-6" style={{ borderColor: "var(--hub-border)", backgroundColor: "var(--hub-surface)" }}>
        <p
          className="text-[10px] uppercase tracking-[0.16em] [font-family:var(--font-space-grotesk),sans-serif]"
          style={{ color: "var(--hub-muted)" }}
        >
          Status
        </p>
        <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--hub-text)" }}>
          이메일은 읽기 전용이며 닉네임과 비밀번호 저장만 지원합니다.
        </p>
      </section>
    </div>
  );
}
