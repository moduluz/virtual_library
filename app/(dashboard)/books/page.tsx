import { Book } from '@/types';
import { supabase } from '@/lib/supabase';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function getBooksDataForUser(userId: string): Promise<Book[]> {
  console.log('[BooksPage - getBooksDataForUser] Fetching books for userId:', userId); // Log userId used in query

  if (!userId) {
    console.error('[BooksPage - getBooksDataForUser] No userId provided.');
    return [];
  }
  if (!supabase) {
    console.error('[BooksPage - getBooksDataForUser] Supabase client not available.');
    return [];
  }

  const { data, error, status } = await supabase
    .from('books') // Ensure 'books' is your table name
    .select('*') // Select all columns for now
    .eq('userId', userId); // Ensure 'userId' is the column name in your 'books' table

  if (error) {
    console.error('[BooksPage - getBooksDataForUser] Supabase error fetching books:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: status
    });
    return [];
  }

  console.log('[BooksPage - getBooksDataForUser] Fetched data:', data); // Log the raw data from Supabase
  return (data as Book[]) || [];
}

export default async function BooksPage() {
  const user = await currentUser();

  if (!user || !user.id) {
    console.log('[BooksPage] User not authenticated, redirecting to sign-in.');
    redirect('/sign-in');
  }

  console.log('[BooksPage] Authenticated user ID from Clerk:', user.id); // Log Clerk user.id

  const books: Book[] = await getBooksDataForUser(user.id);

  console.log(`[BooksPage] Number of books fetched for user ${user.id}:`, books.length);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Books</h1>
        <p className="text-muted-foreground">Manage your personal library</p>
      </div>
      
      {/* You can add your tab navigation here if needed */}
      {/* <div className="mb-6 border-b"> ... tabs ... </div> */}

      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} passHref legacyBehavior>
              <a className="block border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                {book.coverUrl && (
                  <img 
                    src={book.coverUrl} 
                    alt={`Cover of ${book.title}`} 
                    className="w-full h-64 object-contain mb-3 rounded" // Increased height
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
                  {book.author || 'Unknown Author'}
                </p>
                {/* <p className="text-xs text-gray-500">ID: {book.id}</p> */}
                {/* <BookCard book={book} /> */}
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
            {/* Link to your "Add Book" page or open a modal */}
            {/* For example: <Link href="/add-book"><Button>Add Book</Button></Link> */}
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              // onClick={() => router.push('/add-book')} // Or open modal
            >
              Add Book
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
