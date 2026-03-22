import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up",
  description: "User sign up",
};

export default async function SignUpPage() {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    redirect("/lounge");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <section className="rounded-2xl border border-white/15 bg-black/40 p-6">
        <h1 className="text-2xl font-semibold text-white">회원가입</h1>
        <p className="mt-2 text-sm text-zinc-300">
          커뮤니티 참여를 위한 계정을 생성합니다.
        </p>
        <SignUpForm />
        <p className="mt-4 text-sm text-zinc-300">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/sign-in" className="font-medium text-emerald-300 underline">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
