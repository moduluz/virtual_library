import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BookText, BookMarked } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const userId = session.user.id!

  // Get stats
  const [booksRead, pagesRead, booksInProgress, booksWantToRead] = await Promise.all([
    prisma.book.count({ where: { userId, status: "completed" } }),
    prisma.book.findMany({
      where: { userId, status: "completed" },
      select: { pageCount: true },
    }).then(books => books.reduce((sum, b) => sum + (b.pageCount || 0), 0)),
    prisma.book.count({ where: { userId, status: "reading" } }),
    prisma.book.count({ where: { userId, status: "want-to-read" } }),
  ])

  // Get recent books
  const recentBooks = await prisma.book.findMany({
    where: { userId },
    orderBy: { dateAdded: "desc" },
    take: 5,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session.user.name || "Reader"}!</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your reading activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <BookText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{booksRead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagesRead}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{booksInProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Want to Read</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{booksWantToRead}</div>
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
