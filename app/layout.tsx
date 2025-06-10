import type React from "react"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster" // Import Toaster

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Library Manager",
  description: "Manage your personal book collection",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClerkProvider
        appearance={{
          baseTheme: undefined,
          elements: {
            formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
            footerActionLink: "text-purple-600 hover:text-purple-700",
            card: "bg-white shadow-none",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "blockButton",
            shimmer: false,
          },
        }}
      >
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster /> {/* Add Toaster here */}
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  )
}
