import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// Using createRouteMatcher is often cleaner and less error-prone
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook/clerk',
  '/api/webhook/stripe',
]);

export default clerkMiddleware((auth, req: NextRequest) => { // Ensure req is typed as NextRequest if using nextUrl
  // The original isPublicRoute function had an issue with req.url vs pathname.
  // Using createRouteMatcher or new URL(req.url).pathname is better.
  // For simplicity with createRouteMatcher, it handles the request object directly.
  if (isPublicRoute(req)) {
    return; // Allow request to proceed
  }
  auth.protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
