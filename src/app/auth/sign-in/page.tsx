import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { getServerAuthSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "로그인",
  description: "세븐나이츠 리버스 커뮤니티 로그인",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerAuthSession();
  const { callbackUrl } = await searchParams;

  if (session?.user?.id) {
    redirect(callbackUrl || "/lounge");
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title="로그인"
      description="로그인하면 새롭고 강력한 공략을 바로 사용할 수 있습니다."
      footer={
        <p className="text-center">
          아직 계정이 없다면{" "}
          <Link href="/auth/sign-up" className="font-semibold text-[var(--hub-accent)] transition hover:opacity-80">
            회원가입
          </Link>
          으로 이동해 주세요.
        </p>
      }
    >
      <SignInForm callbackUrl={callbackUrl || "/lounge"} />
    </AuthShell>
  );
}
