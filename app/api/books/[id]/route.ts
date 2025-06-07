import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
<<<<<<< HEAD
    const { id } = await params // ✅ Await the params promise
    
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 404 })
=======
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
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551
    }

    return Response.json(book)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

<<<<<<< HEAD
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // ✅ Await the params promise
    const body = await request.json()
    
    const { data: book, error } = await supabase
      .from('books')
      .update(body)
      .eq('id', id)
      .select()
      .single()
=======
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    const { id } = await params
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

<<<<<<< HEAD
    return Response.json(book)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // ✅ Await the params promise
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ message: 'Book deleted successfully' })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
=======
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
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551
  }
}
