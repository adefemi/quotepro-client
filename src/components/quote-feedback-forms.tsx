"use client";

import { useState } from "react";

import { captureClientError, trackClientEvent } from "@/lib/monitoring";

async function submitFeedback(
  quoteId: string,
  path: "revision-requests" | "reviews",
  payload: Record<string, unknown>,
) {
  const response = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Unable to send feedback.");
  }
}

export function RevisionRequestForm({ quoteId }: { quoteId: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  return (
    <form
      className="feedback-form"
      onSubmit={(event) => {
        event.preventDefault();
        setStatus("sending");
        void submitFeedback(quoteId, "revision-requests", { message })
          .then(() => {
            trackClientEvent("quote_revision_requested", { quoteId });
            setMessage("");
            setStatus("sent");
          })
          .catch((error) => {
            captureClientError(error);
            setStatus("error");
          });
      }}
    >
      <label className="field">
        <span>Need changes?</span>
        <textarea
          minLength={3}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell the provider what should change before you pay."
        />
      </label>
      <button className="secondary-button" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Sending..." : "Request changes"}
      </button>
      {status === "sent" ? <p className="success-copy">Request sent to the provider.</p> : null}
      {status === "error" ? <p className="error-copy">Could not send request. Try again.</p> : null}
    </form>
  );
}

export function QuoteReviewForm({ quoteId }: { quoteId: string }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  return (
    <form
      className="feedback-form"
      onSubmit={(event) => {
        event.preventDefault();
        setStatus("sending");
        void submitFeedback(quoteId, "reviews", { message, rating })
          .then(() => {
            trackClientEvent("quote_review_sent", { quoteId, rating });
            setMessage("");
            setStatus("sent");
          })
          .catch((error) => {
            captureClientError(error);
            setStatus("error");
          });
      }}
    >
      <label className="field">
        <span>Rate the job</span>
        <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Leave a review</span>
        <textarea
          minLength={3}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Share how the work went."
        />
      </label>
      <button className="secondary-button" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Sending..." : "Send review"}
      </button>
      {status === "sent" ? <p className="success-copy">Review sent. Thank you.</p> : null}
      {status === "error" ? <p className="error-copy">Could not send review. Try again.</p> : null}
    </form>
  );
}
