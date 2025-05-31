import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabase, type Book, type ReadingStats } from "@/lib/supabase"

async function getReadingStats(userId: string): Promise<ReadingStats> {
  // Try to get stats from Supabase
  const { data: stats, error: statsError } = await supabase
    .from('reading_stats')
    .select('*')
    .eq('userId', userId)
    .single()

  if (stats && !statsError) return stats

  // If no stats exist, calculate them
  const { data: books = [], error: booksError } = await supabase
    .from('books')
    .select('*')
    .eq('userId', userId)

  if (booksError) {
    console.error('Error fetching books:', booksError)
    return {
      userId,
      booksRead: 0,
      pagesRead: 0,
      booksInProgress: 0,
      booksWantToRead: 0,
      readingGoal: 12, // Default reading goal
    }
  }

  const newStats: ReadingStats = {
    userId,
    booksRead: books.filter((book) => book.status === "completed").length,
    pagesRead: books
      .filter((book) => book.status === "completed")
      .reduce((sum, book) => sum + (book.pageCount || 0), 0),
    booksInProgress: books.filter((book) => book.status === "reading").length,
    booksWantToRead: books.filter((book) => book.status === "want-to-read").length,
    readingGoal: 12, // Default reading goal
  }

  // Save stats to Supabase
  const { error } = await supabase
    .from('reading_stats')
    .upsert(newStats)
    .select()

  if (error) {
    console.error('Error saving reading stats:', error)
  }

  return newStats
}

export async function GET(request: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getReadingStats(user.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
} 