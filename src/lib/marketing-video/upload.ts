import { createClient } from "@/lib/supabase/client";

// Client-side, not a Server Action — same reasoning as PropertyPhotoManager's
// direct photo uploads: the Blob is generated in the browser and should go
// straight to Storage rather than through a server round-trip.
export async function uploadMarketingVideo({
  propertyId,
  agentId,
  blob,
  caption,
  listingUpdatedAt,
}: {
  propertyId: string;
  agentId: string;
  blob: Blob;
  caption: string;
  listingUpdatedAt: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("marketing_videos")
    .select("storage_path")
    .eq("property_id", propertyId)
    .maybeSingle();

  // Fresh, never-reused path on every (re)generate — avoids any CDN/browser
  // caching of a stale video under an old URL, per spec.
  const path = `${agentId}/${propertyId}/${crypto.randomUUID()}.mp4`;

  const { error: uploadError } = await supabase.storage.from("marketing-videos").upload(path, blob, {
    contentType: "video/mp4",
  });
  if (uploadError) return { error: "No se pudo subir el video." };

  const { error: upsertError } = await supabase.from("marketing_videos").upsert(
    {
      property_id: propertyId,
      agent_id: agentId,
      storage_path: path,
      caption,
      size_bytes: blob.size,
      listing_updated_at: listingUpdatedAt,
    },
    { onConflict: "property_id" }
  );

  if (upsertError) {
    // Clean up the just-uploaded file rather than leaving an orphan with no row.
    await supabase.storage.from("marketing-videos").remove([path]);
    return { error: "No se pudo guardar el video." };
  }

  // Only delete the old file after the new row/upload both succeeded, so a
  // failure never leaves the listing with zero video.
  if (existing && existing.storage_path !== path) {
    await supabase.storage.from("marketing-videos").remove([existing.storage_path]);
  }

  return { success: true };
}
