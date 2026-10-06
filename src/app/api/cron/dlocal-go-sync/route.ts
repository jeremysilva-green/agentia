import { NextResponse } from "next/server";
import { syncDlocalGoSubscriptions } from "@/lib/dlocalGoSync";

function isAuthorized(request: Request) {
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await syncDlocalGoSubscriptions()) });
}
