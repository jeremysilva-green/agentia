import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAgentShareLink } from "@/lib/actions/agentSocialShares";
import { generateAffiliateLink } from "@/lib/actions/affiliate";
import { renderPropertyFlyer } from "@/components/social-images/renderer";
import {
  getPropertyFlyerProps,
  getAffiliateFlyerProps,
  parseAccent,
  FlyerError,
} from "@/lib/data/property-flyer";

// Fetching and resizing the cover photo plus the Satori render can run past
// the default function timeout on large uploads.
export const maxDuration = 30;

type Params = { params: Promise<{ propertyId: string }> };

/**
 * Renders the flyer for the signed-in user: an agent gets their own listing
 * with their logo; an affiliate (role "user") gets any published listing with
 * their photo and their affiliate link, and no agent logo.
 */
async function renderFor(propertyId: string, accentInput: string | null, showLogoParam: boolean | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new FlyerError("Sesión expirada. Volvé a ingresar.", 401);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const accent = parseAccent(accentInput);

  if (profile?.role === "user") {
    // The affiliate's short link is printed on the flyer, so it has to exist
    // first (this is the same link "Generar link" creates; the call is idempotent).
    const link = await generateAffiliateLink(propertyId);
    if ("error" in link) throw new FlyerError(link.error, 403);

    // Affiliates have no logo of their own: it is off unless they switch it on.
    const props = await getAffiliateFlyerProps(
      supabase,
      propertyId,
      user.id,
      link.shortCode,
      accent,
      showLogoParam ?? false
    );
    return { role: "affiliate" as const, supabase, userId: user.id, accent, png: await renderPropertyFlyer(props) };
  }

  const props = await getPropertyFlyerProps(supabase, propertyId, user.id, accent, showLogoParam ?? true);
  return { role: "agent" as const, supabase, userId: user.id, accent, png: await renderPropertyFlyer(props) };
}

function errorResponse(err: unknown) {
  if (err instanceof FlyerError) return Response.json({ error: err.message }, { status: err.status });
  console.error("[property-flyer] failed", err);
  return Response.json({ error: "No pudimos crear el flyer. Intentá de nuevo." }, { status: 500 });
}

/**
 * GET /api/property-flyer/[propertyId]?color=%23e6b763&logo=0   (logo=0: "Sin Logo", logo=1: with logo)
 *
 * Renders a preview of the flyer. Nothing is stored: the dialog calls this
 * each time the user picks another color or toggles the logo.
 */
export async function GET(request: Request, { params }: Params) {
  const { propertyId } = await params;
  try {
    const query = new URL(request.url).searchParams;
    const logo = query.get("logo");
    const { png } = await renderFor(propertyId, query.get("color"), logo === null ? null : logo !== "0");
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/property-flyer/[propertyId]  { color, logo }
 *
 * "Guardar": renders the flyer again on the server (rather than trusting an
 * uploaded file) and keeps it as the user's flyer for this property (agents
 * in Redes Sociales, affiliates in their panel), replacing the previous one.
 */
export async function POST(request: Request, { params }: Params) {
  const { propertyId } = await params;
  try {
    const body = (await request.json().catch(() => null)) as { color?: string; logo?: boolean } | null;
    const { role, supabase, userId, accent, png } = await renderFor(
      propertyId,
      body?.color ?? null,
      typeof body?.logo === "boolean" ? body.logo : null
    );

    const { data: previous } =
      role === "affiliate"
        ? await supabase
            .from("affiliate_flyers")
            .select("storage_path")
            .eq("property_id", propertyId)
            .eq("user_id", userId)
            .maybeSingle()
        : await supabase
            .from("property_flyers")
            .select("storage_path")
            .eq("property_id", propertyId)
            .eq("agent_id", userId)
            .maybeSingle();

    const storagePath = `${userId}/${propertyId}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("property-flyers")
      .upload(storagePath, png, { contentType: "image/png" });
    if (uploadError) throw new Error(`Flyer upload failed: ${uploadError.message}`);

    const { error: saveError } =
      role === "affiliate"
        ? await supabase
            .from("affiliate_flyers")
            .upsert(
              { property_id: propertyId, user_id: userId, storage_path: storagePath, accent_color: accent },
              { onConflict: "property_id,user_id" }
            )
        : await supabase
            .from("property_flyers")
            .upsert(
              { property_id: propertyId, agent_id: userId, storage_path: storagePath, accent_color: accent },
              { onConflict: "property_id" }
            );
    if (saveError) {
      await supabase.storage.from("property-flyers").remove([storagePath]);
      throw new Error(`Flyer save failed: ${saveError.message}`);
    }

    if (previous?.storage_path) await supabase.storage.from("property-flyers").remove([previous.storage_path]);

    if (role === "agent") {
      // The flyer's short shareable link (agentia.com.py/sa/<code>): created once
      // per property and reused when the flyer is saved again.
      const share = await generateAgentShareLink(propertyId);
      if ("error" in share) console.error("[property-flyer] short link failed", share.error);
      revalidatePath("/panel/redes-sociales");
    } else {
      // Affiliates already have their /s/<code> link (created before rendering).
      revalidatePath("/panel-afiliado/enlaces");
    }

    return Response.json({ success: true, role });
  } catch (err) {
    return errorResponse(err);
  }
}
