import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { addBook } from "@/lib/book-service"

export async function POST(request: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    // Sanitize and validate rating
    if (data.rating !== undefined) {
      if (data.rating === null || data.rating === "" || typeof data.rating === "undefined") {
        data.rating = null
      } else {
        const ratingNum = Number(data.rating)
        if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
          return NextResponse.json({ error: "Rating must be a number between 0 and 5 or null" }, { status: 400 })
        }
        data.rating = ratingNum
      }
    }
    
    try {
      const book = await addBook(user.id, data)
      return NextResponse.json(book)
    } catch (error) {
      console.error("Error adding book:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to add book" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in POST /api/books:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
