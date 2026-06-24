export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Match all routes except static files, _next, and auth/api routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth/signin|auth/signup).*)",
  ],
};
