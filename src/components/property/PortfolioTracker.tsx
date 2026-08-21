"use client";

import { useEffect } from "react";

export function PortfolioTracker({ agentId }: { agentId: string }) {
  useEffect(() => {
    const key = `agently_viewed_portfolio_${agentId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/portfolio/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
      keepalive: true,
    }).catch(() => {});
  }, [agentId]);

  return null;
}
