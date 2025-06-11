"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserButton } from "@clerk/nextjs"
import { BookOpen, BookPlus, Home, Library, Search, User, BarChart } from "lucide-react"
import { ThemeToggleButton } from "@/components/theme-toggle-button"; // Import the ThemeToggleButton

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
    // The /profile route is usually handled by Clerk's UserButton,
    // so you might not need it explicitly here if UserButton links to the profile page.
    // {
    //   href: "/profile",
    //   label: "Profile",
    //   icon: User,
    //   active: pathname === "/profile",
    // },
  ]

  return (
    // Added a wrapper div for better layout control of brand, nav links, and user actions
    <div className="flex items-center justify-between border-b h-16 px-4 md:px-6">
      <div className="flex items-center">
        <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
          <span className="font-bold sm:inline-block text-lg">CHICHICHUCHU</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md", // Added some padding
                  route.active
                    ? "text-primary bg-muted" // More distinct active state
                    : "text-muted-foreground hover:text-foreground/80", // Adjusted hover for non-active
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">{route.label}</span> {/* Show labels on larger screens */}
                <span className="lg:hidden md:inline sr-only">{route.label}</span> {/* Accessibility for icon-only */}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-3"> {/* Container for theme toggle and user button */}
        <ThemeToggleButton /> {/* Add the ThemeToggleButton here */}
        <UserButton afterSignOutUrl="/" />
      </div>
      {/* Consider adding a mobile menu button here that shows/hides the nav items */}
    </div>
  )
}
