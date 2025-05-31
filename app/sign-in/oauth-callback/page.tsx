import { SignIn } from "@clerk/nextjs";

export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Completing OAuth</h1>
          <p className="mt-2 text-gray-600">Please wait while we complete the authentication...</p>
        </div>
        <SignIn path="/sign-in/oauth-callback" routing="path" signUpUrl="/sign-up" />
      </div>
    </div>
  )
} 