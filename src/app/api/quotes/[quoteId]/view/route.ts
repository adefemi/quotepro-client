import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/quote-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  try {
    const { quoteId } = await params;
    const response = await fetch(
      `${getApiBaseUrl()}/public/quotes/${encodeURIComponent(quoteId)}/view`,
      { method: "POST" },
    );
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ message: "Unable to record quote view." }, { status: 500 });
  }
}
