import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function EmailConfirmModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Mail size={22} />
        </span>
        <h2 className="font-display mt-3 text-lg font-semibold text-prussian">{copy.auth.confirmEmailTitle}</h2>
        <p className="font-display-light mt-2 text-sm text-slate-500">{copy.auth.confirmEmailBody}</p>
        <Link href="/ingresar" className="mt-5 block">
          <Button
            type="button"
            size="md"
            className="font-display w-full border! border-black! bg-black! text-white! hover:bg-white! hover:text-black!"
          >
            {copy.auth.confirmEmailCta}
          </Button>
        </Link>
      </div>
    </div>
  );
}
