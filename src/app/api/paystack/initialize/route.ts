import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/quote-data";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      email: string;
      channel: "card" | "bank_transfer" | "ussd";
      publicSlug: string;
    };

    const response = await fetch(`${getApiBaseUrl()}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || "Unable to initialize payment." };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { message: "Unable to initialize payment." },
      { status: 500 },
    );
  }
}
