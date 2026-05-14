import Link from "next/link";
import { notFound } from "next/navigation";

import { PayQuoteForm } from "@/components/pay-quote-form";
import { getQuoteBundle } from "@/lib/quote-data";

export default async function PayQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ purpose?: string }>;
}) {
  const [{ quoteId }, { purpose: requestedPurpose }] = await Promise.all([params, searchParams]);
  const bundle = await getQuoteBundle(quoteId);

  if (!bundle) {
    notFound();
  }

  const { quote } = bundle;
  const purpose = requestedPurpose === "balance" ? "balance" : "deposit";
  const balanceAmount = Math.max(quote.totalAmount - quote.depositAmount, 0);
  const canPayDeposit =
    quote.collectDeposit && quote.depositAmount > 0 && !["partial", "paid", "expired"].includes(quote.status);
  const canPayBalance = quote.status === "partial" && balanceAmount > 0;
  const canPay = purpose === "balance" ? canPayBalance : canPayDeposit;

  if (!canPay) {
    const heading =
      purpose === "balance" && quote.status === "partial"
        ? "No balance is due."
        : quote.status === "partial" || quote.status === "paid"
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
            {purpose === "balance"
              ? "Return to the quote and confirm next steps with the provider."
              : quote.status === "partial" || quote.status === "paid"
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
      <PayQuoteForm
        bundle={bundle}
        purpose={purpose}
        amount={purpose === "balance" ? balanceAmount : quote.depositAmount}
      />
    </div>
  );
}
