import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const ref = typeof body?.ref === "string" ? body.ref : null;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId requerido" }, { status: 400 });
  }

  const service = createServiceClient();

  let affiliateLinkId: string | null = null;
  if (ref) {
    const { data: refProfile } = await service.from("profiles").select("id").eq("username", ref).maybeSingle();
    if (refProfile) {
      const { data } = await service
        .from("affiliate_links")
        .select("id")
        .eq("property_id", propertyId)
        .eq("user_id", refProfile.id)
        .maybeSingle();
      affiliateLinkId = data?.id ?? null;
    }
  }

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

  await service.from("lead_events").insert({
    property_id: propertyId,
    affiliate_link_id: affiliateLinkId,
    event_type: "view",
    visitor_id: visitorId,
  });

  return response;
}
