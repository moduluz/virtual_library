"use client"
import { UserProfile } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { dark } from "@clerk/themes"

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center px-4 py-8"> {/* Centering container */}
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1> {/* Centered title */}
      <Card className="p-4 w-full max-w-3xl"> {/* Card will be centered and have a max-width */}
        <UserProfile
          routing="hash"
          appearance={{
            baseTheme: dark,
            elements: {
              rootBox: "w-full", // Let UserProfile fill the Card
              card: "shadow-none p-0", // Clerk's internal card styling
              navbar: "hidden",
              pageScrollBox: "p-0"
            }
          }}
        />
      </Card>
    </div>
  )
}
