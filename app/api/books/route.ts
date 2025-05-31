import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { addBook } from "@/lib/book-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create users table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('create_users_table_if_not_exists')
    
    if (createTableError) {
      console.error("Error creating users table:", createTableError)
      // Continue anyway, as the table might already exist
    }

    // Ensure user exists in our database
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress?.emailAddress
      })
      .select()
      .single()

    if (userError) {
      console.error("Error ensuring user exists:", userError)
      // Continue anyway, as we can still add the book
    }

    const data = await request.json()
    
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
