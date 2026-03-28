import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { getServerAuthSession } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "회원가입",
  description: "세븐나이츠 리버스 커뮤니티 회원가입",
};

export default async function SignUpPage() {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    redirect("/lounge");
  }

  return (
    <AuthShell
      eyebrow="Recruitment"
      title="회원가입"
      description="새 계정을 생성하면 새롭고 강력한 공략을 바로 사용할 수 있습니다."
      footer={
        <p className="text-center">
          이미 계정을 보유하고 있다면{" "}
          <Link href="/auth/sign-in" className="font-semibold text-[var(--hub-accent)] transition hover:opacity-80">
            로그인
          </Link>
          으로 바로 복귀할 수 있습니다.
        </p>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
