"use client"
import { Book } from "@/lib/supabase"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, BookText, BookMarked } from "lucide-react"

type BookDisplayProps = {
  books: Book[]
}

export function BookDisplay({ books }: BookDisplayProps) {
  const [viewMode] = useLocalStorage<"grid" | "list">("book-view-mode", "grid")
  
  if (books.length === 0) {
    return (
      <Card>
        <div className="py-8">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No books found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add some books to see them here.</p>
            <Link
              href="/add-book"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Add Book
            </Link>
          </div>
        </div>
      </Card>
    )
  }
  
  if (viewMode === "grid") {
    return <BookGrid books={books} />
  }
  
  return <BookList books={books} />
}

function BookGrid({ books }: BookDisplayProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book) => (
        <Link href={`/books/${book.id}`} key={book.id}>
          <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
            <div className="aspect-[2/3] relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img
                src={book.coverUrl || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(book.title)}`}
                alt={book.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute bottom-2 left-2 right-2 z-20">
                <p className="text-white font-medium line-clamp-2">{book.title}</p>
                <p className="text-white/80 text-sm line-clamp-1">{book.author}</p>
                <div className="flex items-center mt-1">
                  {book.status === "reading" && (
                    <span className="flex items-center text-xs bg-blue-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Reading
                    </span>
                  )}
                  {book.status === "completed" && (
                    <span className="flex items-center text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookText className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  )}
                  {book.status === "want-to-read" && (
                    <span className="flex items-center text-xs bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookMarked className="w-3 h-3 mr-1" />
                      Want to Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function BookList({ books }: BookDisplayProps) {
  return (
    <div className="space-y-3">
      {books.map((book) => (
        <Link href={`/books/${book.id}`} key={book.id}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 flex items-center">
              <div className="w-16 h-24 flex-shrink-0 mr-4">
                <img
                  src={book.coverUrl || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(book.title)}`}
                  alt={book.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{book.title}</h3>
                <p className="text-muted-foreground text-sm">{book.author}</p>
                <div className="flex items-center mt-1">
                  {book.status === "reading" && (
                    <span className="flex items-center text-xs bg-blue-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Reading
                    </span>
                  )}
                  {book.status === "completed" && (
                    <span className="flex items-center text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookText className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  )}
                  {book.status === "want-to-read" && (
                    <span className="flex items-center text-xs bg-amber-500/80 text-white px-2 py-0.5 rounded-full">
                      <BookMarked className="w-3 h-3 mr-1" />
                      Want to Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 