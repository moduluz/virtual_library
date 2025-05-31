import { clerkMiddleware } from "@clerk/nextjs/server";

const isPublicRoute = (req: Request) => {
  const publicPaths = [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhook/clerk',
    '/api/webhook/stripe',
  ];
  return publicPaths.some(path => new RegExp(`^${path}$`).test(req.url));
};

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;
  auth.protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
