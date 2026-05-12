"use client";

import { useEffect, useState } from "react";

import { captureClientError, trackClientEvent } from "@/lib/monitoring";

type ReceiptActionsProps = {
  quoteId: string;
  providerName: string;
  amountLabel: string;
  reference: string;
};

type ShareStatus = "idle" | "shared" | "copied" | "error";

export function ReceiptActions({ quoteId, providerName, amountLabel, reference }: ReceiptActionsProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");

  useEffect(() => {
    if (shareStatus === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setShareStatus("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const shareText = `Deposit of ${amountLabel} paid to ${providerName} for quote ${quoteId}.`;

  async function handleShare() {
    const url = window.location.href;
    const sharePayload = {
      title: "QuotePro deposit receipt",
      text: shareText,
      url,
    } satisfies ShareData;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(sharePayload);
        setShareStatus("shared");
        trackClientEvent("receipt_shared", { method: "web_share", reference });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        captureClientError(error);
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        trackClientEvent("receipt_shared", { method: "clipboard", reference });
        return;
      } catch (error) {
        captureClientError(error);
      }
    }

    setShareStatus("error");
  }

  function handleDownload() {
    trackClientEvent("receipt_download_requested", { reference });
    window.print();
  }

  const shareLabel =
    shareStatus === "shared"
      ? "Receipt shared"
      : shareStatus === "copied"
        ? "Link copied"
        : shareStatus === "error"
          ? "Share unavailable"
          : "Share receipt";

  return (
    <div className="receipt-actions" data-print-hide="true">
      <button type="button" onClick={handleShare} aria-live="polite">
        {shareLabel}
      </button>
      <button type="button" onClick={handleDownload}>
        Download PDF
      </button>
    </div>
  );
}
