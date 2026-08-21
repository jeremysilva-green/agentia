import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderPropertyCard } from "@/components/social-images/renderer";
import { getPropertyForSocialCard } from "@/lib/data/social-image-property";

/**
 * POST /api/social-images/generate
 *
 * Called by Make.com after Guardar Cambios. This endpoint is service-to-service —
 * it does NOT check a user session. Auth is a shared secret header, matching the
 * x-webhook-secret pattern already used between Supabase and Make.com elsewhere
 * in this project.
 *
 * Set SOCIAL_IMAGE_RENDER_SECRET in the environment, and configure Make.com's
 * HTTP module to send it as `x-render-secret`.
 *
 * ASSUMPTION TO VERIFY: expects a `generated-social-images` Storage bucket to
 * already exist (public, for getPublicUrl() to work). Create it if it doesn't.
 */

const RENDER_SECRET = process.env.SOCIAL_IMAGE_RENDER_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-render-secret");
  if (!RENDER_SECRET || secret !== RENDER_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { propertyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { propertyId } = body;
  if (!propertyId) {
    return NextResponse.json({ success: false, error: "propertyId is required" }, { status: 400 });
  }

  try {
    const propertyData = await getPropertyForSocialCard(propertyId);
    const png = await renderPropertyCard(propertyData, "instagram-feed");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `${propertyId}/property-card-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("generated-social-images")
      .upload(filePath, png, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated-social-images")
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Social image generation failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
