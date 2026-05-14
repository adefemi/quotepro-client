"use client";

import { useEffect } from "react";

import { captureClientError, trackClientEvent } from "@/lib/monitoring";

export function QuoteViewTracker({ quoteId }: { quoteId: string }) {
  useEffect(() => {
    const controller = new AbortController();

    async function recordView() {
      const response = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/view`, {
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Unable to record quote view.");
      }

      trackClientEvent("quote_view_recorded", { quoteId });
    }

    void recordView().catch((error) => {
      if (!controller.signal.aborted) {
        captureClientError(error);
      }
    });

    return () => controller.abort();
  }, [quoteId]);

  return null;
}
