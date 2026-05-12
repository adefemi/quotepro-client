import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { ReceiptActions } from "./receipt-actions";

const trackClientEvent = vi.fn();
const captureClientError = vi.fn();

vi.mock("@/lib/monitoring", () => ({
  trackClientEvent: (...args: unknown[]) => trackClientEvent(...args),
  captureClientError: (...args: unknown[]) => captureClientError(...args),
}));

const baseProps = {
  quoteId: "Q-2041",
  providerName: "Tolu Plumbing Services",
  amountLabel: "₦178,611",
  reference: "ref_live",
};

type MutableNavigator = { share?: Navigator["share"] };

function setShare(value: Navigator["share"] | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(navigator as unknown as MutableNavigator, "share");
  } else {
    (navigator as unknown as MutableNavigator).share = value;
  }
}

describe("ReceiptActions", () => {
  const originalShare = (navigator as unknown as MutableNavigator).share;
  const originalClipboard = navigator.clipboard;
  const originalPrint = window.print;

  beforeEach(() => {
    trackClientEvent.mockClear();
    captureClientError.mockClear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "https://quotepro.app/q/A3XF-2041/receipt?reference=ref_live" },
    });
  });

  afterEach(() => {
    setShare(originalShare);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    window.print = originalPrint;
  });

  it("uses navigator.share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });

    render(<ReceiptActions {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Share receipt/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "QuotePro deposit receipt",
          text: expect.stringContaining("Tolu Plumbing Services"),
          url: "https://quotepro.app/q/A3XF-2041/receipt?reference=ref_live",
        }),
      );
      expect(screen.getByRole("button", { name: /Receipt shared/i })).toBeInTheDocument();
      expect(trackClientEvent).toHaveBeenCalledWith(
        "receipt_shared",
        expect.objectContaining({ method: "web_share", reference: "ref_live" }),
      );
    });
  });

  it("falls back to clipboard when navigator.share is not available", async () => {
    setShare(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<ReceiptActions {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Share receipt/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://quotepro.app/q/A3XF-2041/receipt?reference=ref_live",
      );
      expect(screen.getByRole("button", { name: /Link copied/i })).toBeInTheDocument();
      expect(trackClientEvent).toHaveBeenCalledWith(
        "receipt_shared",
        expect.objectContaining({ method: "clipboard", reference: "ref_live" }),
      );
    });
  });

  it("ignores AbortError when the user cancels the share sheet", async () => {
    const abortError = new DOMException("Cancelled", "AbortError");
    const share = vi.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });

    render(<ReceiptActions {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Share receipt/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    expect(captureClientError).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Share receipt/i })).toBeInTheDocument();
  });

  it("falls back to clipboard when navigator.share rejects unexpectedly", async () => {
    const share = vi.fn().mockRejectedValue(new Error("permission denied"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<ReceiptActions {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Share receipt/i }));

    await waitFor(() => {
      expect(captureClientError).toHaveBeenCalled();
      expect(writeText).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Link copied/i })).toBeInTheDocument();
    });
  });

  it("surfaces an unavailable state when both share and clipboard are missing", async () => {
    setShare(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    render(<ReceiptActions {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Share receipt/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Share unavailable/i })).toBeInTheDocument();
    });
  });

  it("triggers window.print when Download PDF is clicked", () => {
    const print = vi.fn();
    window.print = print;

    render(<ReceiptActions {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/i }));

    expect(print).toHaveBeenCalled();
    expect(trackClientEvent).toHaveBeenCalledWith(
      "receipt_download_requested",
      expect.objectContaining({ reference: "ref_live" }),
    );
  });
});
