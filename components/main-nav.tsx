"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserButton } from "@clerk/nextjs"
import { BookOpen, BookPlus, Home, Library, Search, User, BarChart } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/books",
      label: "My Books",
      icon: BookOpen,
      active: pathname === "/books",
    },
    {
      href: "/collections",
      label: "Collections",
      icon: Library,
      active: pathname === "/collections",
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart,
      active: pathname === "/analytics",
    },
    {
      href: "/add-book",
      label: "Add Book",
      icon: BookPlus,
      active: pathname === "/add-book",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      active: pathname === "/search",
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      active: pathname === "/profile",
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => {
        const Icon = route.icon
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-black dark:text-white" : "text-muted-foreground",
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">{route.label}</span>
          </Link>
        )
      })}
      <div className="ml-auto">
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}
