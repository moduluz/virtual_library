import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { getBookById, updateBook, deleteBook } from "@/lib/book-service"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const book = await getBookById(user.id, id)

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error in GET /api/books/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    const { id } = await params

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
      await updateBook(user.id, id, data)
      return NextResponse.json({ message: "Book updated successfully" })
    } catch (error) {
      console.error("Error updating book:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update book" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in PATCH /api/books/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await deleteBook(user.id, id)
      return NextResponse.json({ message: "Book deleted successfully" })
    } catch (error) {
      console.error("Error deleting book:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to delete book" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in DELETE /api/books/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
