import { quoteProColors } from "@/lib/design-tokens";

import { formatNaira } from "@/lib/format";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-copy">
        <span className="eyebrow" style={{ color: quoteProColors.primary }}>
          QuotePro · Nigeria
        </span>
        <h1>
          Quote.
          <br />
          Send.
          <br />
          <strong>Cash.</strong>
        </h1>
        <p>
          Build pro quotes in 60 seconds, share them where the customer already
          lives, and collect a deposit before the job starts.
        </p>
        <p className="footnote">Create a quote in the provider app to generate a live client link.</p>
      </section>

      <section className="landing-preview">
        <div className="quote-card hero-preview">
          <div className="progress-strip" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="eyebrow">Quote preview</span>
          <h2>Bathroom re-piping</h2>
          <strong className="big-number">{formatNaira(357223)}</strong>
          <p>Hosted client experience built for WhatsApp-opened links.</p>
        </div>
      </section>
    </main>
  );
}
