import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BooksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { dateAdded: "desc" },
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Books</h1>
        <p className="text-muted-foreground">Manage your personal library</p>
      </div>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} passHref legacyBehavior>
              <a className="block border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                {book.coverUrl && (
                  <img
                    src={book.coverUrl}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-64 object-contain mb-3 rounded"
                  />
                )}
                {!book.coverUrl && (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center mb-3 rounded">
                    <span className="text-gray-500">No Cover</span>
                  </div>
                )}
                <h2 className="text-lg font-semibold truncate" title={book.title}>
                  {book.title}
                </h2>
                <p className="text-sm text-gray-600 truncate" title={book.author || undefined}>
                  {book.author || "Unknown Author"}
                </p>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">Add some books to see them here.</p>
          <div className="mt-6">
            <Link
              href="/add-book"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Add Book
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
