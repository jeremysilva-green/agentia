"use client";

import { useEffect } from "react";

export function LeadTracker({ propertyId, refCode }: { propertyId: string; refCode?: string }) {
  useEffect(() => {
    const key = `agently_viewed_${propertyId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/leads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ref: refCode }),
      keepalive: true,
    }).catch(() => {});
  }, [propertyId, refCode]);

  return null;
}
