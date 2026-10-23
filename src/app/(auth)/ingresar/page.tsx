import Link from "next/link";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import { copy } from "@/lib/copy";

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
        <h1 className="font-display text-center text-2xl font-semibold text-white">
          {copy.auth.loginTitle}
        </h1>
        <div className="rounded-2xl border border-emerald-500/40 bg-black/30 p-6 backdrop-blur-md sm:p-8">
          <LoginForm next={next} />
        </div>
        <p className="font-display-light text-center text-sm text-white/70">
          {copy.auth.noAccount}{" "}
          <Link href="/registro" className="font-medium text-emerald-400 hover:underline">
            {copy.nav.signup}
          </Link>
        </p>
      </div>
    </div>
  );
}
