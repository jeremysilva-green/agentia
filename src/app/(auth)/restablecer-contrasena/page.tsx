import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { copy } from "@/lib/copy";

// Reached directly via the recovery email's link (resetPasswordForEmail's
// redirectTo points straight here). Deliberately does NOT exchange the
// ?code= itself: Server Components can't set cookies in Next.js, so
// calling exchangeCodeForSession here would appear to work for this one
// render (the in-memory session looks fine) but never actually persist a
// session cookie to the browser — confirmed by reproducing exactly this
// failure. The code is instead handed to updatePassword (a Server Action,
// which can set cookies) via a hidden field, and exchanged there.
export default async function RestablecerContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    // No code and no way to get one from here — only an existing session
    // (e.g. a page refresh right after a successful exchange) makes sense.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/ingresar");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-900">
      <InteractiveBackground dotColor="rgb(255 255 255 / 0.14)" spotColor="rgb(52 211 153 / 0.9)" />

      <div className="relative mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
        <h1 className="font-display text-center text-2xl font-semibold text-white">{copy.auth.resetPasswordTitle}</h1>
        <Card className="border-emerald-200! bg-emerald-50! p-6 sm:p-8">
          <ResetPasswordForm code={code} />
        </Card>
      </div>
    </div>
  );
}
