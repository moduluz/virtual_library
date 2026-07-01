import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org + project (fill in after creating Sentry project)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI/production to avoid slowing down local dev
  silent: !process.env.CI,

  // Upload source maps for better stack traces in Sentry
  widenClientFileUpload: true,

  // Disable Sentry's auto-instrumentation of API routes in dev
  disableLogger: true,

  // Don't run Sentry during local development
  autoInstrumentServerFunctions: process.env.NODE_ENV === "production",
});
