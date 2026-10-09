export function isVideoStale(video: { listing_updated_at: string }, property: { updated_at: string }): boolean {
  return new Date(video.listing_updated_at).getTime() < new Date(property.updated_at).getTime();
}
