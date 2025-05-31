"use client"
import { UserProfile } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <Card className="p-4">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-3xl",
              card: "shadow-none p-0 mx-auto",
              navbar: "hidden",
              pageScrollBox: "p-0"
            }
          }}
        />
      </Card>
    </div>
  )
}
