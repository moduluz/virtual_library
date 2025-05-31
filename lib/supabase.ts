import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

// Client-side singleton
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient(token?: string) {
  // Always create a new client if a token is provided, to ensure the correct Authorization header is set
  if (token) {
    return createBrowserClient(
      supabaseUrl as string,
      supabaseAnonKey as string,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
  }
  // Fallback to singleton if no token (for anonymous usage)
  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseUrl as string,
      supabaseAnonKey as string
    );
  }
  return browserClient;
}

// Book type definition
export type Book = {
  id: string
  title: string
  author: string
  isbn?: string
  coverUrl?: string
  pdfUrl?: string
  description?: string
  genre?: string
  pageCount?: number
  publishedDate?: string
  status: "reading" | "completed" | "want-to-read"
  rating: number | null
  notes?: string
  dateAdded: string
  userId: string
}

// Collection type definition
export type Collection = {
  id: string
  name: string
  description?: string
  bookIds: string[]
  userId: string
  dateCreated: string
}

// User reading stats
export type ReadingStats = {
  userId: string
  booksRead: number
  pagesRead: number
  booksInProgress: number
  booksWantToRead: number
  readingGoal: number
} 