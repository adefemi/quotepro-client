import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/quote-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  try {
    const [{ quoteId }, payload] = await Promise.all([params, request.json()]);
    const response = await fetch(
      `${getApiBaseUrl()}/public/quotes/${encodeURIComponent(quoteId)}/revision-requests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ message: "Unable to send revision request." }, { status: 500 });
  }
}
