"use client";

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

let initialized = false;

export function initializeClientMonitoring() {
  if (initialized) {
    return;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost || "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0.1,
    });
  }

  initialized = true;
}

export function captureClientError(error: unknown) {
  Sentry.captureException(error);
}

export function trackClientEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, properties);
}
