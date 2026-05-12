export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "partial" | "paid" | "expired";
export type PaymentStatus = "pending" | "initialized" | "paid" | "failed";

export interface ProviderProfileRecord {
  id: string;
  businessName: string;
  serviceLine: string;
  customerPhone: string;
  hasLogo: boolean;
  hasPayoutAccount: boolean;
  payoutBankName?: string;
  payoutAccountLast4?: string;
}

export interface QuoteLineItemRecord {
  id: string;
  title: string;
  quantityLabel: string;
  unitAmount: number;
  totalAmount: number;
}

export interface QuoteRecord {
  id: string;
  publicSlug: string;
  providerId: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  jobTitle: string;
  description: string;
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
  depositAmount: number;
  validUntil: string;
  status: QuoteStatus;
  collectDeposit: boolean;
  items: QuoteLineItemRecord[];
}

export interface QuoteEventRecord {
  id: string;
  quoteId: string;
  kind: "drafted" | "sent" | "viewed" | "accepted" | "deposit_paid" | "payment_failed" | "paid_out";
  label: string;
  at: string;
}

export interface PaymentRecord {
  id: string;
  quoteId: string;
  amount: number;
  reference: string;
  status: PaymentStatus;
}

export interface QuoteBundleRecord {
  quote: QuoteRecord;
  provider: ProviderProfileRecord;
  timeline: QuoteEventRecord[];
}

export interface DashboardSummaryRecord {
  paidTotal: number;
  quoteCount: number;
  activeCount: number;
  acceptedCount: number;
  recentQuotes: QuoteRecord[];
}

export interface EarningsSummaryRecord {
  paidAmount: number;
  paidCount: number;
  topCustomers: Array<{
    name: string;
    amount: number;
  }>;
}

export const demoProvider: ProviderProfileRecord = {
  id: "provider-01",
  businessName: "Tolu Plumbing Services",
  serviceLine: "Licensed plumber · Lagos",
  customerPhone: "+234 803 221 4490",
  hasLogo: false,
  hasPayoutAccount: false,
};

export const demoQuote: QuoteRecord = {
  id: "Q-2041",
  publicSlug: "A3XF-2041",
  providerId: demoProvider.id,
  customerName: "Adunni Okafor",
  customerPhone: "+234 807 512 3391",
  customerLocation: "Lekki Phase 1, Lagos",
  jobTitle: "Full bathroom re-piping",
  description:
    "Replace old copper with PPR piping, fittings, shut-off valves, and labour for two plumbers over three days.",
  subtotalAmount: 332300,
  vatAmount: 24923,
  totalAmount: 357223,
  depositAmount: 178611,
  validUntil: "2026-05-04",
  status: "partial",
  collectDeposit: true,
  items: [
    { id: "item-01", title: "PPR piping · 20mm", quantityLabel: "60 m", unitAmount: 1800, totalAmount: 108000 },
    { id: "item-02", title: "PPR piping · 25mm", quantityLabel: "24 m", unitAmount: 2400, totalAmount: 57600 },
    { id: "item-03", title: "Fittings, elbows, tees", quantityLabel: "1 lot", unitAmount: 18500, totalAmount: 18500 },
    { id: "item-04", title: "Shut-off valves", quantityLabel: "6 pcs", unitAmount: 4200, totalAmount: 25200 },
    { id: "item-05", title: "Labour · 2 plumbers × 3 days", quantityLabel: "6 days", unitAmount: 18000, totalAmount: 108000 },
    { id: "item-06", title: "Removal of old copper + disposal", quantityLabel: "1 job", unitAmount: 15000, totalAmount: 15000 },
  ],
};

export const demoTimeline: QuoteEventRecord[] = [
  { id: "evt-01", quoteId: demoQuote.id, kind: "sent", label: "Sent via WhatsApp", at: "2026-04-20T12:30:00.000Z" },
  { id: "evt-02", quoteId: demoQuote.id, kind: "viewed", label: "Viewed 3 times", at: "2026-04-20T13:42:00.000Z" },
  { id: "evt-03", quoteId: demoQuote.id, kind: "accepted", label: "Adunni tapped Accept", at: "2026-04-20T14:29:00.000Z" },
  { id: "evt-04", quoteId: demoQuote.id, kind: "deposit_paid", label: "Deposit paid via bank transfer", at: "2026-04-20T14:40:00.000Z" },
];
