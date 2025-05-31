import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { supabase, type Book, type ReadingStats } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BookText, BookMarked } from "lucide-react"
import Link from "next/link"

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
      readingGoal: 0
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
    readingGoal: 0
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

async function getRecentBooks(userId: string): Promise<Book[]> {
  const { data: books = [], error } = await supabase
    .from('books')
    .select('*')
    .eq('userId', userId)
    .order('dateAdded', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching recent books:', error)
    return []
  }

  return books
}

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const stats = await getReadingStats(user.id)
  const recentBooks = await getRecentBooks(user.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.firstName || "Reader"}!</h1>
        <p className="text-muted-foreground">Here's an overview of your reading activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <BookText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksRead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pagesRead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksInProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Want to Read</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksWantToRead}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recently Added Books</h2>
        {recentBooks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {recentBooks.map((book) => (
              <Link href={`/books/${book.id}`} key={book.id}>
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                  <div className="aspect-[2/3] relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img
                      src={
                        book.coverUrl || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(book.title)}`
                      }
                      alt={book.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 right-2 z-20">
                      <p className="text-white font-medium line-clamp-2">{book.title}</p>
                      <p className="text-white/80 text-sm line-clamp-1">{book.author}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No books yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Start building your library by adding some books.</p>
                <Link
                  href="/add-book"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Add Your First Book
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
