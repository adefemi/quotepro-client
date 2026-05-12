"use client";

import { useEffect, useState } from "react";

import { ReceiptView } from "@/components/client-pages";
import type { PaymentRecord } from "@/lib/contracts";
import { captureClientError } from "@/lib/monitoring";
import type { QuoteBundle } from "@/lib/quote-data";

type PaymentStatusMonitorProps = {
  bundle: QuoteBundle;
  payment?: PaymentRecord;
  reference?: string;
};

function isTerminalPayment(payment: PaymentRecord | undefined) {
  return payment?.status === "paid" || payment?.status === "failed";
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
    throw new Error("Unable to verify payment.");
  }

  return (await response.json()) as PaymentRecord;
}

export function PaymentStatusMonitor({ bundle, payment, reference }: PaymentStatusMonitorProps) {
  const [currentPayment, setCurrentPayment] = useState(payment);
  const [isPolling, setIsPolling] = useState(false);
  const currentStatus = currentPayment?.status;

  useEffect(() => {
    if (!reference || !currentStatus || currentStatus === "paid" || currentStatus === "failed") {
      return;
    }

    const paymentReference = reference;
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function pollPaymentStatus() {
      setIsPolling(true);

      try {
        const verifiedPayment = await verifyPayment({
          publicSlug: bundle.quote.publicSlug,
          reference: paymentReference,
        });

        if (isCancelled) {
          return;
        }

        setCurrentPayment(verifiedPayment);

        if (isTerminalPayment(verifiedPayment)) {
          setIsPolling(false);
          return;
        }
      } catch (error) {
        if (!isCancelled) {
          captureClientError(error);
        }
      }

      if (!isCancelled) {
        timeoutId = setTimeout(pollPaymentStatus, 3000);
      }
    }

    void pollPaymentStatus();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [bundle.quote.publicSlug, currentStatus, reference]);

  return (
    <ReceiptView
      bundle={bundle}
      payment={currentPayment}
      reference={reference}
      isPolling={isPolling}
    />
  );
}
