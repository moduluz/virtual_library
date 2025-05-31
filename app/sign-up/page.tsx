import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Join our library community</p>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
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
            },
          }}
        />
      </div>
    </div>
  )
}
