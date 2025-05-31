import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { addCollection } from "@/lib/collection-service"

export async function POST(request: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const collection = await addCollection(user.id, data)

    return NextResponse.json(collection)
  } catch (error) {
    console.error("Error adding collection:", error)
    return NextResponse.json({ error: "Failed to add collection" }, { status: 500 })
  }
} 