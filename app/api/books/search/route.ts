import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { getAllBooks } from "@/lib/book-service"

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const { filters } = await request.json()
    
    const allBooks = await getAllBooks(user.id)
    
    // Apply search and filters
    let filteredBooks = allBooks
    
    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        (book.genre && book.genre.toLowerCase().includes(lowerQuery)) ||
        (book.description && book.description.toLowerCase().includes(lowerQuery))
      )
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      filteredBooks = filteredBooks.filter(book => 
        filters.status.includes(book.status)
      )
    }
    
    // Genre filter
    if (filters.genres && filters.genres.length > 0) {
      filteredBooks = filteredBooks.filter(book => 
        book.genre && filters.genres.includes(book.genre)
      )
    }
    
    // Rating filter
    if (filters.rating) {
      filteredBooks = filteredBooks.filter(book => 
        book.rating && book.rating >= filters.rating
      )
    }
    
    return NextResponse.json(filteredBooks)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to search books" }, { status: 500 })
  }
} 