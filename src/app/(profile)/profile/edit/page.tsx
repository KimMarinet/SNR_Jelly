import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "개인 정보 수정",
  description: "프로필 정보 확인 및 수정 페이지",
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

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">개인 정보 수정</h1>
        <p className="mt-2 text-sm text-zinc-300">
          계정 정보 확인 화면입니다. 실제 수정 저장 기능은 다음 단계에서 연동됩니다.
        </p>
      </header>

      <section className="rounded-2xl border border-white/15 bg-black/30 p-6">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-zinc-400">이메일</dt>
            <dd className="mt-1 font-medium text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">닉네임</dt>
            <dd className="mt-1 font-medium text-white">{user.nickname}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">권한</dt>
            <dd className="mt-1 font-medium text-white">{user.role}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">가입일</dt>
            <dd className="mt-1 font-medium text-white">
              {user.createdAt.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
