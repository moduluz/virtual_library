import { currentUser } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getBookById } from "@/lib/book-service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, BookText, BookMarked, Star, Edit } from "lucide-react"
import Link from "next/link"
import BookDeleteButton from "./book-delete-button"
import { PDFViewer } from "@/components/pdf-viewer"

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // Await params first
  const user = await currentUser()
  const { id } = await params

  if (!user) {
    redirect("/sign-in")
  }

  const book = await getBookById(user.id, id)

  if (!book) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/books" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Books
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div>
          <Card className="overflow-hidden">
            <img
              src={book.coverUrl || `/placeholder.svg?height=450&width=300&text=${encodeURIComponent(book.title)}`}
              alt={book.title}
              className="object-cover w-full aspect-[2/3]"
            />
          </Card>

          <div className="mt-4 space-y-2">
            <Link href={`/books/${book.id}/edit`}>
              <Button variant="outline" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Book
              </Button>
            </Link>

            {book.pdfUrl && (
              <PDFViewer pdfUrl={book.pdfUrl} title={book.title} />
            )}

            <BookDeleteButton bookId={book.id} bookTitle={book.title} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-xl text-muted-foreground">by {book.author}</p>

            <div className="flex items-center mt-2 space-x-2">
              {book.status === "reading" && (
                <span className="flex items-center text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Currently Reading
                </span>
              )}
              {book.status === "completed" && (
                <span className="flex items-center text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full">
                  <BookText className="w-4 h-4 mr-1" />
                  Completed
                </span>
              )}
              {book.status === "want-to-read" && (
                <span className="flex items-center text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1 rounded-full">
                  <BookMarked className="w-4 h-4 mr-1" />
                  Want to Read
                </span>
              )}
            </div>
          </div>

          {book.rating && (
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < book.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{book.rating!} out of 5</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {book.genre && (
              <div>
                <p className="font-medium">Genre</p>
                <p className="text-muted-foreground">{book.genre}</p>
              </div>
            )}

            {book.pageCount && (
              <div>
                <p className="font-medium">Pages</p>
                <p className="text-muted-foreground">{book.pageCount}</p>
              </div>
            )}

            {book.isbn && (
              <div>
                <p className="font-medium">ISBN</p>
                <p className="text-muted-foreground">{book.isbn}</p>
              </div>
            )}

            {book.publishedDate && (
              <div>
                <p className="font-medium">Published</p>
                <p className="text-muted-foreground">{book.publishedDate}</p>
              </div>
            )}

            <div>
              <p className="font-medium">Date Added</p>
              <p className="text-muted-foreground">{new Date(book.dateAdded).toLocaleDateString()}</p>
            </div>
          </div>

          {book.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{book.description}</p>
            </div>
          )}

          {book.notes && (
            <div>
              <h2 className="text-xl font-semibold mb-2">My Notes</h2>
              <Card>
                <CardContent className="p-4">
                  <p className="whitespace-pre-line">{book.notes}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
