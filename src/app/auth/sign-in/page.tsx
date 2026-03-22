import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
  description: "User sign in",
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
    <main className="mx-auto max-w-md px-4 py-14">
      <section className="rounded-2xl border border-white/15 bg-black/40 p-6">
        <h1 className="text-2xl font-semibold text-white">로그인</h1>
        <p className="mt-2 text-sm text-zinc-300">
          계정으로 로그인하고 게시글 작성 기능을 이용하세요.
        </p>
        <SignInForm callbackUrl={callbackUrl || "/lounge"} />
        <p className="mt-4 text-sm text-zinc-300">
          계정이 없으신가요?{" "}
          <Link href="/auth/sign-up" className="font-medium text-emerald-300 underline">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}
