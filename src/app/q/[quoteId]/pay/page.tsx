import Link from "next/link";
import { notFound } from "next/navigation";

import { PayQuoteForm } from "@/components/pay-quote-form";
import { getQuoteBundle } from "@/lib/quote-data";

export default async function PayQuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const bundle = await getQuoteBundle(quoteId);

  if (!bundle) {
    notFound();
  }

  const { quote } = bundle;
  const canPayDeposit =
    quote.collectDeposit && quote.depositAmount > 0 && !["partial", "paid", "expired"].includes(quote.status);

  if (!canPayDeposit) {
    const heading =
      quote.status === "partial" || quote.status === "paid"
        ? "Deposit already received."
        : quote.status === "expired"
          ? "This quote has expired."
          : "No deposit is required.";

    return (
      <div className="quote-shell">
        <div className="browser-bar">quotepro.app/q/{bundle.quote.publicSlug}/pay</div>
        <div className="receipt-shell">
          <div className="success-badge">!</div>
          <h1>{heading}</h1>
          <p>
            {quote.status === "partial" || quote.status === "paid"
              ? "This quote already has a confirmed deposit."
              : "Return to the quote and confirm next steps with the provider."}
          </p>
          <Link className="primary-button" href={`/q/${quote.publicSlug}`}>
            Back to quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-shell">
      <div className="browser-bar">quotepro.app/q/{bundle.quote.publicSlug}/pay</div>
      <PayQuoteForm bundle={bundle} />
    </div>
  );
}
