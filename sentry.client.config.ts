import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Capture 10% of transactions for performance monitoring (free tier friendly)
  tracesSampleRate: 0.1,

  // Set sampling rate for profiling - relative to tracesSampleRate
  profilesSampleRate: 0.1,

  // Don't print Sentry debug info in console
  debug: false,
});
