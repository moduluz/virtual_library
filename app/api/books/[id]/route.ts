import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { getBookById, updateBook, deleteBook } from "@/lib/book-service"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const book = await getBookById(user.id, params.id)

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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    try {
      await updateBook(user.id, params.id, data)
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await deleteBook(user.id, params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting book:", error)
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
  }
}
