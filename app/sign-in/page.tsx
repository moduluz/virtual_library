import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        routing="hash" // Or "path" if your sign-in page is a catch-all
        fallbackRedirectUrl="/dashboard" // <-- Changed from afterSignInUrl
        // afterSignInUrl="/dashboard" // <-- Remove this
      />
    </div>
  )
}
