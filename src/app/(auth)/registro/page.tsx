import Link from "next/link";
import { Briefcase, User } from "lucide-react";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { copy } from "@/lib/copy";

export default function RegistroPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            {copy.auth.chooseRole}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/registro/agente">
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-emerald-500/40 bg-black/30 p-6 text-center backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Briefcase size={22} />
              </span>
              <h2 className="font-display text-lg font-semibold text-white">{copy.auth.asAgentIndependent}</h2>
              <p className="font-display-light text-sm text-white/60">{copy.auth.asAgentIndependentDesc}</p>
              <p className="font-display-light mt-auto text-base font-semibold text-emerald-400">{copy.auth.free}</p>
            </div>
          </Link>

          <Link href="/registro/usuario">
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-emerald-500/40 bg-black/30 p-6 text-center backdrop-blur-md transition-transform duration-300 ease-out hover:scale-[1.03]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <User size={22} />
              </span>
              <h2 className="font-display text-lg font-semibold text-white">{copy.auth.asUser}</h2>
              <p className="font-display-light text-sm text-white/60">{copy.auth.asUserDesc}</p>
              <p className="font-display-light mt-auto text-base font-semibold text-emerald-400">{copy.auth.free}</p>
            </div>
          </Link>
        </div>

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
