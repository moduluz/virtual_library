import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

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
  rating?: number
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