import Link from "next/link";
import { Briefcase, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { copy } from "@/lib/copy";
import { PLANS } from "@/lib/plans";

function formatGs(amount: number) {
  return `Gs. ${amount.toLocaleString("es-PY")}`;
}

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
          <Link href="/registro/agente?tipo=independiente">
            <Card className="flex h-full flex-col items-center gap-3 border-emerald-200! bg-emerald-50! p-6 text-center transition-shadow hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Briefcase size={22} />
              </span>
              <h2 className="font-display text-lg font-semibold text-prussian">{copy.auth.asAgentIndependent}</h2>
              <p className="font-display-light text-sm text-slate-600">{copy.auth.asAgentIndependentDesc}</p>
              <p className="font-display-light mt-auto text-base font-semibold text-prussian">
                {formatGs(PLANS.independiente.price)}
                <span className="text-sm font-normal text-slate-600">{copy.auth.perMonth}</span>
              </p>
            </Card>
          </Link>

          <Link href="/registro/usuario">
            <Card className="flex h-full flex-col items-center gap-3 border-emerald-200! bg-emerald-50! p-6 text-center transition-shadow hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <User size={22} />
              </span>
              <h2 className="font-display text-lg font-semibold text-prussian">{copy.auth.asUser}</h2>
              <p className="font-display-light text-sm text-slate-600">{copy.auth.asUserDesc}</p>
              <p className="font-display-light mt-auto text-base font-semibold text-prussian">{copy.auth.free}</p>
            </Card>
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
