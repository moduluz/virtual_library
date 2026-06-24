"use client"

import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, LogOut, Shield } from "lucide-react"

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-20 w-20 rounded-full object-cover border-2 border-purple-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-600 text-white text-2xl font-bold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{session?.user?.name || "User"}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-muted-foreground">{session?.user?.name || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-muted-foreground">{session?.user?.email || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-muted-foreground text-xs">{session?.user?.id || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
