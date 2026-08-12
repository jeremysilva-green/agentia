import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { UserSignupForm } from "@/components/auth/UserSignupForm";
import { copy } from "@/lib/copy";

export default function RegistroUsuarioPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
        <h1 className="font-display text-center text-2xl font-semibold text-white">
          {copy.auth.asUser}
        </h1>
        <Card className="border-emerald-200! bg-emerald-50! p-6 sm:p-8">
          <UserSignupForm />
        </Card>
        <p className="font-display-light text-center text-sm text-white/70">
          {copy.auth.hasAccount}{" "}
          <Link href="/ingresar" className="font-medium text-emerald-400 hover:underline">
            {copy.nav.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
