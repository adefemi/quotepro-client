import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { demoProvider, demoQuote, demoTimeline } from "@/lib/contracts";
import { PayQuoteForm } from "./pay-quote-form";
import type { QuoteBundle } from "@/lib/quote-data";

const { newTransaction } = vi.hoisted(() => ({
  newTransaction: vi.fn(),
}));

vi.mock("@/lib/monitoring", () => ({
  captureClientError: vi.fn(),
  trackClientEvent: vi.fn(),
}));

vi.mock("paystack-inline-ts", () => ({
  default: vi.fn(function PaystackPopMock() {
    return {
      newTransaction,
    };
  }),
}));

const push = vi.fn();
const bundle: QuoteBundle = {
  quote: demoQuote,
  provider: demoProvider,
  timeline: demoTimeline,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("PayQuoteForm", () => {
  beforeEach(() => {
    push.mockClear();
    newTransaction.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /api/paystack/initialize and opens the inline Paystack popup", async () => {
    newTransaction.mockImplementation((options) => {
      options.onSuccess?.({ id: "txn_1", reference: "ref_live", message: "Approved" });
    });
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          authorizationUrl: "https://checkout.paystack.com/abc",
          reference: "ref_live",
          publicKey: "pk_test_live",
          mode: "live",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PayQuoteForm bundle={bundle} />
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/Email address/i), "buyer@example.com");
    fireEvent.click(screen.getByText(/Pay ₦178,611/i));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/paystack/initialize",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "buyer@example.com",
            channel: "card",
            publicSlug: demoQuote.publicSlug,
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(newTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "pk_test_live",
          email: "buyer@example.com",
          amount: demoQuote.depositAmount * 100,
          currency: "NGN",
          channels: ["card"],
          reference: "ref_live",
          metadata: expect.objectContaining({
            quoteId: demoQuote.id,
            publicSlug: demoQuote.publicSlug,
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/paystack/verify",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            publicSlug: demoQuote.publicSlug,
            reference: "ref_live",
          }),
        }),
      );
      expect(push).toHaveBeenCalledWith("/q/A3XF-2041/receipt?reference=ref_live");
    });
  });

  it("redirects to the hosted receipt state for mock payments", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          authorizationUrl: "/q/A3XF-2041/receipt",
          reference: "mock_q-2041",
          mode: "mock",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    ).mockResolvedValueOnce(
      new Response(JSON.stringify({ reference: "mock_q-2041", status: "paid" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PayQuoteForm bundle={bundle} />
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/Email address/i), "buyer@example.com");
    fireEvent.click(screen.getByText(/Pay ₦178,611/i));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/paystack/verify",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            publicSlug: demoQuote.publicSlug,
            reference: "mock_q-2041",
          }),
        }),
      );
      expect(push).toHaveBeenCalledWith("/q/A3XF-2041/receipt?reference=mock_q-2041");
    });
  });

  it("shows the loading overlay while Paystack is booting and dismisses it on cancel", async () => {
    const callbacks: { onCancel?: () => void } = {};
    newTransaction.mockImplementation((options) => {
      callbacks.onCancel = options.onCancel;
    });
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          authorizationUrl: "https://checkout.paystack.com/abc",
          reference: "ref_live",
          publicKey: "pk_test_live",
          mode: "live",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PayQuoteForm bundle={bundle} />
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/Email address/i), "buyer@example.com");
    fireEvent.click(screen.getByText(/Pay ₦178,611/i));

    await waitFor(() => {
      const loader = screen.getByTestId("checkout-loader");
      expect(within(loader).getByText(/Loading secure checkout/i)).toBeInTheDocument();
      expect(
        within(loader).getByText(/Paystack is opening a secure window/i),
      ).toBeInTheDocument();
    });

    callbacks.onCancel?.();

    await waitFor(() => {
      expect(screen.queryByTestId("checkout-loader")).not.toBeInTheDocument();
      expect(screen.getByText(/Payment was cancelled before completion/i)).toBeInTheDocument();
    });
  });

  it("switches the loader to a confirming state while verifying the payment", async () => {
    let resolveVerify: ((value: Response) => void) | undefined;
    const verifyPromise = new Promise<Response>((resolve) => {
      resolveVerify = resolve;
    });
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            authorizationUrl: "https://checkout.paystack.com/abc",
            reference: "ref_live",
            publicKey: "pk_test_live",
            mode: "live",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockReturnValueOnce(verifyPromise);
    newTransaction.mockImplementation((options) => {
      options.onSuccess?.({ id: "txn_1", reference: "ref_live", message: "Approved" });
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PayQuoteForm bundle={bundle} />
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/Email address/i), "buyer@example.com");
    fireEvent.click(screen.getByText(/Pay ₦178,611/i));

    await waitFor(() => {
      const loader = screen.getByTestId("checkout-loader");
      expect(within(loader).getByText(/Confirming payment/i)).toBeInTheDocument();
      expect(
        within(loader).getByText(/Hang tight while we mark your deposit as paid/i),
      ).toBeInTheDocument();
    });

    resolveVerify?.(
      new Response(JSON.stringify({ status: "paid" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/q/A3XF-2041/receipt?reference=ref_live");
    });
  });

  it("shows the API error message when initialization fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "This quote does not require a deposit payment." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <QueryClientProvider client={new QueryClient()}>
        <PayQuoteForm bundle={bundle} />
      </QueryClientProvider>,
    );

    await userEvent.type(screen.getByLabelText(/Email address/i), "buyer@example.com");
    fireEvent.click(screen.getByText(/Pay ₦178,611/i));

    await waitFor(() => {
      expect(screen.getByText(/This quote does not require a deposit payment/i)).toBeInTheDocument();
    });
  });
});
