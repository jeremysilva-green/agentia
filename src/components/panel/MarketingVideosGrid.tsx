"use client";

import { MonthYearAccordion } from "@/components/panel/MonthYearAccordion";
import { MarketingVideoCard } from "@/components/panel/MarketingVideoCard";
import type { MarketingVideoRow } from "@/lib/data/marketingVideos";

export function MarketingVideosGrid({ videos }: { videos: MarketingVideoRow[] }) {
  return (
    <MonthYearAccordion
      rows={videos}
      getDate={(v) => v.created_at}
      renderGroup={(monthRows) => (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {monthRows.map((video) => (
            <MarketingVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    />
  );
}
