import { SignIn } from "@clerk/nextjs"
import { Suspense } from "react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your library account</p>
        </div>
        <Suspense fallback={<div className="flex justify-center">Loading...</div>}>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-sm normal-case",
                card: "bg-white shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-gray-300 text-gray-600",
                socialButtonsBlockButtonText: "font-normal text-sm",
                formFieldLabel: "text-gray-700",
                formFieldInput: "border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500",
                footerActionLink: "text-purple-600 hover:text-purple-700",
                formFieldError: "text-red-500 text-sm mt-1",
                formFieldWarning: "text-yellow-500 text-sm mt-1",
                formFieldSuccess: "text-green-500 text-sm mt-1",
              },
            }}
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </Suspense>
      </div>
    </div>
  )
}
