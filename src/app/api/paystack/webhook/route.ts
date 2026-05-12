import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/quote-data";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const response = await fetch(`${getApiBaseUrl()}/payments/paystack/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": request.headers.get("x-paystack-signature") ?? "",
      },
      body,
    });

    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
