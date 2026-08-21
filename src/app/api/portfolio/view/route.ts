import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const agentId = typeof body?.agentId === "string" ? body.agentId : null;

  if (!agentId) {
    return NextResponse.json({ error: "agentId requerido" }, { status: 400 });
  }

  const service = createServiceClient();

  const cookieStore = await cookies();
  let visitorId = cookieStore.get("agently_visitor")?.value ?? null;
  const response = NextResponse.json({ ok: true });

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set("agently_visitor", visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  await service.from("portfolio_views").insert({ agent_id: agentId, visitor_id: visitorId });

  return response;
}
