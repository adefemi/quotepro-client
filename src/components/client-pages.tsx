import Link from "next/link";

import type { PaymentRecord } from "@/lib/contracts";
import { type QuoteBundle } from "@/lib/quote-data";
import { formatNaira, formatQuoteDate } from "@/lib/format";
import { ReceiptActions } from "@/components/receipt-actions";

export function PublicQuoteView({ bundle }: { bundle: QuoteBundle }) {
  const { provider, quote } = bundle;
  const canPayDeposit =
    quote.collectDeposit && quote.depositAmount > 0 && !["partial", "paid", "expired"].includes(quote.status);

  return (
    <div className="quote-shell">
      <div className="browser-bar">
        <span>quotepro.app/q/{quote.publicSlug}</span>
      </div>
      <section className="quote-card provider-card">
        <div className="brand-avatar">T</div>
        <div className="provider-copy">
          <span className="eyebrow">Quote from</span>
          <h1>{provider.businessName}</h1>
          <p>Verified · 48 paid jobs</p>
        </div>
      </section>

      <section className="quote-card quote-paper">
        <div className="progress-strip" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="quote-header">
          <span>Quote {quote.id}</span>
          <span>Valid {formatQuoteDate(quote.validUntil)}</span>
        </div>

        <h2>{quote.jobTitle}</h2>

        <div className="quote-total-card">
          <div>
            <span className="eyebrow">Total</span>
            <strong>{formatNaira(quote.totalAmount)}</strong>
            <p>VAT included</p>
          </div>
          <div className="deposit-summary">
            <span className="eyebrow">Deposit</span>
            <strong>{formatNaira(quote.depositAmount)}</strong>
            <p>On accept</p>
          </div>
        </div>

        <div className="section-title">What&apos;s included</div>
        <ul className="line-item-list">
          {quote.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.quantityLabel}</span>
              </div>
              <span>{formatNaira(item.totalAmount)}</span>
            </li>
          ))}
        </ul>

        <div className="guarantee-card">
          <strong>12-month workmanship guarantee.</strong>
          <p>Balance payable on completion. Deposit held securely until the quote is accepted.</p>
        </div>
      </section>

      {canPayDeposit ? (
        <div className="sticky-action">
          <Link className="primary-button" href={`/q/${quote.publicSlug}/pay`}>
            Accept &amp; pay deposit →
          </Link>
          <p>Secured by Paystack · Card, transfer, USSD</p>
        </div>
      ) : (
        <div className="sticky-action">
          <span className="primary-button" aria-disabled="true">
            {quote.status === "partial" || quote.status === "paid"
              ? "Deposit received"
              : quote.status === "expired"
                ? "Quote expired"
                : "No deposit required"}
          </span>
          <p>
            {quote.status === "partial" || quote.status === "paid"
              ? "This quote already has a confirmed deposit."
              : "Review the quote and confirm next steps with the provider."}
          </p>
        </div>
      )}
    </div>
  );
}

export function ReceiptView({
  bundle,
  payment,
  reference,
  isPolling = false,
}: {
  bundle: QuoteBundle;
  payment?: PaymentRecord;
  reference?: string;
  isPolling?: boolean;
}) {
  if (payment?.status !== "paid") {
    const title =
      payment?.status === "failed"
        ? "Payment was not completed."
        : payment
          ? "Payment is being confirmed."
          : "We could not verify this payment.";
    const body =
      payment?.status === "failed"
        ? "Please retry the deposit payment or contact the provider if money left your account."
        : isPolling
          ? "We're checking Paystack automatically. This page will update as soon as the deposit is confirmed."
        : payment
          ? "Paystack has not confirmed this deposit yet. Refresh this page in a moment."
          : "Use the receipt link returned by Paystack after a successful payment.";

    return (
      <div className="receipt-shell">
        <div className="success-badge">!</div>
        <h1>{title}</h1>
        <p>{body}</p>
        <dl className="receipt-grid">
          <div>
            <dt>Reference</dt>
            <dd>{reference ?? "Missing"}</dd>
          </div>
          <div>
            <dt>Quote</dt>
            <dd>{bundle.quote.id}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{isPolling ? "confirming" : (payment?.status ?? "unverified")}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{bundle.provider.businessName}</dd>
          </div>
        </dl>
        <Link className="primary-button" href={`/q/${bundle.quote.publicSlug}/pay`}>
          Try payment again
        </Link>
      </div>
    );
  }

  return (
    <div className="receipt-shell paid">
      <div className="success-badge">✓</div>
      <h1>Deposit paid. Job is on.</h1>
      <p>
        We&apos;ve notified {bundle.provider.businessName}. They can now confirm the next
        available start date.
      </p>
      <dl className="receipt-grid">
        <div>
          <dt>Receipt</dt>
          <dd>{payment.reference}</dd>
        </div>
        <div>
          <dt>Quote</dt>
          <dd>{bundle.quote.id}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{formatNaira(payment.amount)}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{bundle.provider.businessName}</dd>
        </div>
      </dl>

      <ReceiptActions
        quoteId={bundle.quote.id}
        providerName={bundle.provider.businessName}
        amountLabel={formatNaira(payment.amount)}
        reference={payment.reference}
      />

      <div className="growth-card" data-print-hide="true">
        <strong>Run a service business?</strong>
        <p>See how QuotePro turns WhatsApp conversations into quotes, deposits, and payouts.</p>
      </div>
    </div>
  );
}
