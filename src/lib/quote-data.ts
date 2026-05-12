import type { PaymentRecord, QuoteBundleRecord } from "@/lib/contracts";

export type QuoteBundle = QuoteBundleRecord;
export type PaymentStatusRecord = PaymentRecord;

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";
}

export async function getQuoteBundle(slugOrId: string): Promise<QuoteBundle | undefined> {
  const response = await fetch(`${getApiBaseUrl()}/public/quotes/${encodeURIComponent(slugOrId)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error("Unable to load quote.");
  }

  return (await response.json()) as QuoteBundle;
}

export async function getPaymentStatus(input: {
  publicSlug: string;
  reference: string;
}): Promise<PaymentStatusRecord | undefined> {
  const params = new URLSearchParams({ publicSlug: input.publicSlug });
  const response = await fetch(
    `${getApiBaseUrl()}/payments/${encodeURIComponent(input.reference)}/status?${params.toString()}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error("Unable to verify payment.");
  }

  return (await response.json()) as PaymentStatusRecord;
}
