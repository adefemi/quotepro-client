import { notFound } from "next/navigation";

import { PaymentStatusMonitor } from "@/components/payment-status-monitor";
import { getPaymentStatus, getQuoteBundle } from "@/lib/quote-data";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ reference?: string }>;
}) {
  const [{ quoteId }, { reference }] = await Promise.all([params, searchParams]);
  const bundle = await getQuoteBundle(quoteId);

  if (!bundle) {
    notFound();
  }

  const payment = reference
    ? await getPaymentStatus({
        publicSlug: bundle.quote.publicSlug,
        reference,
      })
    : undefined;

  return <PaymentStatusMonitor bundle={bundle} payment={payment} reference={reference} />;
}
