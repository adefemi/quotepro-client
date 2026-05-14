"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatNaira } from "@/lib/format";
import { captureClientError, trackClientEvent } from "@/lib/monitoring";
import { type QuoteBundle } from "@/lib/quote-data";
import type { PaymentPurpose } from "@/lib/contracts";

const payQuoteSchema = z.object({
  email: z.string().email(),
  channel: z.enum(["card", "bank_transfer", "ussd"]),
});

type PayQuoteValues = z.infer<typeof payQuoteSchema>;
type PaymentInitializationResult = {
  authorizationUrl: string;
  reference: string;
  publicKey?: string;
  mode: "live" | "mock";
};
type PaystackChannel = "card" | "bank" | "ussd" | "mobile_money" | "qr" | "bank_transfer" | "eft";
type NewTransactionOptions = {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  channels?: PaystackChannel[];
  reference?: string;
  metadata?: Record<string, unknown>;
  onCancel?: () => void;
  onError?: (error: { message: string }) => void;
  onSuccess?: (response: { id: string; reference: string; message: string }) => void;
};

async function openPaystackPopup(options: NewTransactionOptions) {
  const { default: PaystackPop } = await import("paystack-inline-ts");
  const paystack = new PaystackPop();
  return paystack.newTransaction(options);
}

const channelMap: Record<PayQuoteValues["channel"], PaystackChannel> = {
  card: "card",
  bank_transfer: "bank_transfer",
  ussd: "ussd",
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const errBody = (await response.json()) as { message?: string };
    if (typeof errBody.message === "string" && errBody.message.trim()) {
      return errBody.message;
    }
  } catch {
    /* keep default message */
  }

  return fallback;
}

async function verifyPayment(input: { publicSlug: string; reference: string }) {
  const response = await fetch("/api/paystack/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Unable to verify payment."));
  }
}

export function PayQuoteForm({
  bundle,
  purpose,
  amount,
}: {
  bundle: QuoteBundle;
  purpose: PaymentPurpose;
  amount: number;
}) {
  const router = useRouter();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const showCheckoutLoader = isOpeningCheckout || isVerifyingPayment;

  const form = useForm<PayQuoteValues>({
    resolver: zodResolver(payQuoteSchema),
    defaultValues: {
      email: "",
      channel: "card",
    },
  });

  const initializePayment = useMutation({
    mutationFn: async (values: PayQuoteValues) => {
      setCheckoutError(null);
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          channel: values.channel,
          publicSlug: bundle.quote.publicSlug,
          purpose,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, "Unable to initialize payment.");
        throw new Error(message);
      }

      const result = (await response.json()) as PaymentInitializationResult;
      return { result, values };
    },
    onSuccess: ({ result, values }) => {
      trackClientEvent("payment_initialized", {
        quoteId: bundle.quote.id,
        mode: result.mode,
        purpose,
      });

      if (result.mode === "mock") {
        setIsVerifyingPayment(true);
        void verifyPayment({
          publicSlug: bundle.quote.publicSlug,
          reference: result.reference,
        })
          .catch(captureClientError)
          .finally(() => {
            setIsVerifyingPayment(false);
            router.push(`/q/${bundle.quote.publicSlug}/receipt?reference=${encodeURIComponent(result.reference)}`);
          });
        return;
      }

      if (!result.publicKey) {
        setCheckoutError("Paystack checkout could not start. Please try again.");
        return;
      }

      setIsOpeningCheckout(true);
      void openPaystackPopup({
        key: result.publicKey,
        email: values.email,
        amount: amount * 100,
        currency: "NGN",
        channels: [channelMap[values.channel]],
        reference: result.reference,
        metadata: {
          quoteId: bundle.quote.id,
          publicSlug: bundle.quote.publicSlug,
          purpose,
        },
        onCancel: () => {
          setIsOpeningCheckout(false);
          setCheckoutError("Payment was cancelled before completion.");
        },
        onError: (error) => {
          setIsOpeningCheckout(false);
          const message = error.message || "Paystack checkout could not start.";
          setCheckoutError(message);
          captureClientError(new Error(message));
        },
        onSuccess: (response) => {
          const reference = response.reference || result.reference;
          setIsOpeningCheckout(false);
          setIsVerifyingPayment(true);
          void verifyPayment({
            publicSlug: bundle.quote.publicSlug,
            reference,
          })
            .catch(captureClientError)
            .finally(() => {
              setIsVerifyingPayment(false);
              router.push(`/q/${bundle.quote.publicSlug}/receipt?reference=${encodeURIComponent(reference)}`);
            });
        },
      }).catch((error) => {
        setIsOpeningCheckout(false);
        const message = error instanceof Error ? error.message : "Paystack checkout could not start.";
        setCheckoutError(message);
        captureClientError(error);
      });
    },
    onError: (error) => {
      captureClientError(error);
    },
  });

  return (
    <form
      className="payment-stack"
      onSubmit={form.handleSubmit((values) => initializePayment.mutate(values))}
    >
      <div className="progress-strip" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="quote-card">
        <div className="payment-summary">
          <div className="brand-avatar">T</div>
          <div>
            <span>Paying {bundle.provider.businessName}</span>
            <strong>{purpose === "balance" ? "Balance" : "Deposit"} · {bundle.quote.id}</strong>
          </div>
          <strong>{formatNaira(amount)}</strong>
        </div>
      </div>

      <div className="quote-card">
        <label className="field">
          <span>Email address</span>
          <input type="email" {...form.register("email")} />
          {form.formState.errors.email ? <small>{form.formState.errors.email.message}</small> : null}
        </label>
      </div>

      <div className="quote-card">
        <div className="section-title">Pay with</div>
        <div className="channel-list">
          {[
            { label: "Card", value: "card", subtitle: "Verve, Visa, Mastercard" },
            { label: "Bank transfer", value: "bank_transfer", subtitle: "Instant via virtual account" },
            { label: "USSD", value: "ussd", subtitle: "*737# · *894# · more" },
          ].map((option) => (
            <label className="channel-option" key={option.value}>
              <input type="radio" value={option.value} {...form.register("channel")} />
              <div>
                <strong>{option.label}</strong>
                <span>{option.subtitle}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        className="primary-button"
        disabled={initializePayment.isPending || isOpeningCheckout || isVerifyingPayment}
        type="submit"
      >
        {isVerifyingPayment
          ? "Confirming payment..."
          : isOpeningCheckout
            ? "Loading secure checkout..."
            : initializePayment.isPending
              ? "Starting payment..."
              : `Pay ${formatNaira(amount)} →`}
      </button>

      {initializePayment.isError || checkoutError ? (
        <p className="error-copy">
          {checkoutError ??
          (initializePayment.error instanceof Error
            ? initializePayment.error.message
            : "We couldn't initialize the payment. Please try again.")}
        </p>
      ) : null}

      <p className="footnote">Secured by Paystack · PCI-DSS compliant</p>

      {showCheckoutLoader ? (
        <div className="checkout-loader" role="status" aria-live="polite" data-testid="checkout-loader">
          <div className="checkout-loader-card">
            <div className="checkout-spinner" aria-hidden="true" />
            <p className="checkout-loader-title">
              {isVerifyingPayment ? "Confirming payment…" : "Loading secure checkout…"}
            </p>
            <p className="checkout-loader-subtitle">
              {isVerifyingPayment
                ? `Hang tight while we mark your ${purpose === "balance" ? "balance" : "deposit"} as paid.`
                : "Paystack is opening a secure window. This usually takes a second."}
            </p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
