import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create users table if it doesn't exist
    const { error: createTableError } = await supabaseAdmin.rpc('create_users_table_if_not_exists')
    
    if (createTableError) {
      console.error("Error creating users table:", createTableError)
      // Continue anyway, as the table might already exist
    }

    // Ensure user exists in our database
    const { error: userError } = await supabaseAdmin
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
    
    // Add the userId to the book data
    const bookData = {
      ...data,
      userId: user.id, // Explicitly add the userId
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    }
    
    try {
      // Use service role client to insert directly
      const { data: insertedBook, error } = await supabaseAdmin
        .from('books')
        .insert(bookData)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error adding book:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      if (!insertedBook) {
        throw new Error('Failed to create book: No data returned')
      }

      console.log('Successfully added book:', insertedBook)
      
      // Delete stats cache
      try {
        await supabaseAdmin
          .from('reading_stats')
          .delete()
          .eq('userId', user.id)
      } catch (error) {
        console.error('Error deleting stats cache:', error)
        // Don't throw here, as the book was successfully added
      }

      return NextResponse.json(insertedBook)
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
