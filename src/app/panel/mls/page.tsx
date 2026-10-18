import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { getMlsMembershipStatus } from "@/lib/actions/mlsMembership";
import { hasActiveMlsAccess } from "@/lib/plans";
import { JoinMlsForm } from "@/components/panel/mls/JoinMlsForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export default async function MlsPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  const mlsEligible = hasActiveMlsAccess(ctx.subscription);
  const { membership, currentRuleVersion, needsReaccept } = await getMlsMembershipStatus(ctx.userId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-white">{copy.mls.title}</h1>

      {!mlsEligible ? (
        <Card className="flex flex-col gap-3 p-6 text-center sm:text-left">
          <p className="text-sm font-medium text-slate-800">{copy.mls.planRequired}</p>
          <p className="text-sm text-slate-600">{copy.mls.joinBody}</p>
          <Link href="/panel/suscripcion" className="self-start">
            <Button type="button">{copy.mls.planRequiredCta}</Button>
          </Link>
        </Card>
      ) : membership?.status === "removed" ? (
        <Card className="flex items-start gap-3 border-red-200 bg-red-50 p-6">
          <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={20} />
          <p className="text-sm text-red-800">
            Tu membresía del MLS fue dada de baja. Si creés que esto es un error, contactanos.
          </p>
        </Card>
      ) : membership?.status === "active" && !needsReaccept ? (
        <Card className="flex items-start gap-3 border-emerald-200 bg-emerald-50 p-6">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-900">{copy.mls.alreadyMember}</p>
            {membership.activated_at && (
              <p className="mt-1 text-xs text-emerald-700">
                {copy.mls.memberSinceLabel}{" "}
                {new Date(membership.activated_at).toLocaleDateString("es-PY", { dateStyle: "long" })}
              </p>
            )}
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-6">
          {needsReaccept && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{copy.mls.needsReaccept}</p>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800">{copy.mls.joinTitle}</p>
            <p className="mt-1 text-sm text-slate-600">{copy.mls.joinBody}</p>
          </div>
          <JoinMlsForm
            defaultCi={membership?.ci ?? ""}
            defaultAgencyName={membership?.agency_name ?? ""}
            reglamentoBody={currentRuleVersion?.body ?? ""}
            isReaccept={needsReaccept}
          />
        </Card>
      )}
    </div>
  );
}
