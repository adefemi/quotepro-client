import { notFound } from "next/navigation";

import { PublicQuoteView } from "@/components/client-pages";
import { getQuoteBundle } from "@/lib/quote-data";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const bundle = await getQuoteBundle(quoteId);

  if (!bundle) {
    notFound();
  }

  return <PublicQuoteView bundle={bundle} />;
}
