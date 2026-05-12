import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { demoProvider, demoQuote, demoTimeline } from "@/lib/contracts";
import { PaymentStatusMonitor } from "./payment-status-monitor";
import { PublicQuoteView, ReceiptView } from "./client-pages";
import type { QuoteBundle } from "@/lib/quote-data";

const bundle: QuoteBundle = {
  quote: demoQuote,
  provider: demoProvider,
  timeline: demoTimeline,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReceiptView", () => {
  it("renders the success state for a paid deposit", () => {
    render(
      <ReceiptView
        bundle={bundle}
        payment={{
          id: "payment-1",
          quoteId: demoQuote.id,
          amount: demoQuote.depositAmount,
          reference: "mock_q-2041",
          status: "paid",
        }}
        reference="mock_q-2041"
      />,
    );

    expect(screen.getByText("Deposit paid. Job is on.")).toBeInTheDocument();
    expect(screen.getByText("mock_q-2041")).toBeInTheDocument();
    expect(screen.getByText("Tolu Plumbing Services")).toBeInTheDocument();
  });

  it("does not render success when the payment is unverified", () => {
    render(<ReceiptView bundle={bundle} reference="unknown_ref" />);

    expect(screen.getByText("We could not verify this payment.")).toBeInTheDocument();
    expect(screen.queryByText("Deposit paid. Job is on.")).not.toBeInTheDocument();
  });

  it("polls pending receipts until the backend confirms payment", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "payment-1",
          quoteId: demoQuote.id,
          amount: demoQuote.depositAmount,
          reference: "ref_poll",
          status: "paid",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <PaymentStatusMonitor
        bundle={bundle}
        payment={{
          id: "payment-1",
          quoteId: demoQuote.id,
          amount: demoQuote.depositAmount,
          reference: "ref_poll",
          status: "initialized",
        }}
        reference="ref_poll"
      />,
    );

    expect(screen.getByText("Payment is being confirmed.")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Deposit paid. Job is on.")).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/paystack/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          publicSlug: demoQuote.publicSlug,
          reference: "ref_poll",
        }),
      }),
    );
  });
});

describe("PublicQuoteView", () => {
  it("does not show a payment CTA when no deposit is required", () => {
    render(
      <PublicQuoteView
        bundle={{
          ...bundle,
          quote: {
            ...bundle.quote,
            collectDeposit: false,
            depositAmount: 0,
            status: "sent",
          },
        }}
      />,
    );

    expect(screen.getByText("No deposit required")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Accept & pay deposit/i })).not.toBeInTheDocument();
  });
});
