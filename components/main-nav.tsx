"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { BookOpen, BookPlus, Home, Library, Search, BarChart, LogOut, User } from "lucide-react"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

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
  ]

  return (
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
                  "flex items-center text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md",
                  route.active
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">{route.label}</span>
                <span className="lg:hidden md:inline sr-only">{route.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-3">
        <ThemeToggleButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {session?.user?.name && (
                  <p className="font-medium">{session.user.name}</p>
                )}
                {session?.user?.email && (
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
