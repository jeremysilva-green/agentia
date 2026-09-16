import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { copy } from "@/lib/copy";

// Reached directly via the recovery email's link (resetPasswordForEmail's
// redirectTo points straight here, not through /auth/callback — see the
// comment in requestPasswordReset for why), so this page does its own
// ?code= exchange rather than relying on a separate callback route.
export default async function RestablecerContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // No session means the link expired, was already used, or was never
  // valid — nothing to let them do here.
  if (!user) redirect("/ingresar");

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
        <h1 className="font-display text-center text-2xl font-semibold text-white">{copy.auth.resetPasswordTitle}</h1>
        <Card className="border-emerald-200! bg-emerald-50! p-6 sm:p-8">
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
}
