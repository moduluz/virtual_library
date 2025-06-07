import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export const createClerkSupabaseClient = (getToken: any) => {
  console.log('[lib/supabase] createClerkSupabaseClient function CALLED.'); // Log A
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options = {}) => {
        console.log('[lib/supabase] fetch override CALLED. URL:', url.toString().substring(0, 100)); // Log B
        try {
          console.log('[lib/supabase] Attempting to call getToken({ template: "supabase" })'); // Log C
          const clerkToken = await getToken({ template: 'supabase' }); 
          
          if (!clerkToken) {
            console.error('[lib/supabase] CRITICAL: getToken returned null or undefined. Check Clerk JWT template name ("supabase") and setup.'); // Log D (Error)
            // Optionally, you could throw an error here to stop the request
            // throw new Error("Clerk token for Supabase is missing");
          } else {
            console.log('[lib/supabase] Clerk Token for Supabase (first 20 chars):', clerkToken.substring(0, 20)); // Log E (Token)
          }
          
          const headers = new Headers(options?.headers);
          headers.set('Authorization', `Bearer ${clerkToken}`);
          
          console.log('[lib/supabase] Fetching with Authorization header set.'); // Log F
          return fetch(url, { ...options, headers });
        } catch (error) {
          console.error('[lib/supabase] Error INSIDE fetch override (e.g., getToken threw an error):', error); // Log G (Error)
          throw error; 
        }
      }
    }
  })
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