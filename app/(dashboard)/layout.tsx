import type React from "react"
import { MainNav } from "@/components/main-nav"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <div className="mr-4 hidden md:flex">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <span className="font-bold">LibraryApp</span>
            </Link>
          </div>
          <MainNav />
        </div>
      </header>
      <main className="flex-1 container py-6 px-4">{children}</main>
    </div>
  )
}
