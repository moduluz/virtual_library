import { supabase, type Book } from "./supabase"

// Get all books for a user
export async function getAllBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('userId', userId)
  
  if (error) {
    console.error('Error fetching books:', error)
    return []
  }
  
  return data || []
}

// Get a single book by ID
export async function getBookById(userId: string, bookId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('userId', userId)
    .eq('id', bookId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116: Row not found
      console.error('Error fetching book:', error)
    }
    return null
  }

  return data
}

// Add a new book
export async function addBook(userId: string, book: Omit<Book, 'id' | 'userId' | 'dateAdded'>): Promise<Book> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  console.log('Adding book with data:', { userId, book })

  const newBook: Book = {
    ...book,
    id: crypto.randomUUID(),
    userId,
    dateAdded: new Date().toISOString(),
  }
  
  console.log('Prepared book data:', newBook)

  // Try to verify the user exists, but continue if it fails
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error verifying user:', userError)
      // Continue anyway, as we can still add the book
    }
  } catch (error) {
    console.error('Error in user verification:', error)
    // Continue anyway, as we can still add the book
  }

  const { data, error } = await supabase
    .from('books')
    .insert(newBook)
    .select()
    .single()
  
  if (error) {
    console.error('Supabase error adding book:', error)
    throw new Error(`Database error: ${error.message}`)
  }

  if (!data) {
    console.error('No data returned after book insertion')
    throw new Error('Failed to create book: No data returned')
  }

  console.log('Successfully added book:', data)
  
  // Delete stats cache
  try {
    await supabase
      .from('reading_stats')
      .delete()
      .eq('userId', userId)
  } catch (error) {
    console.error('Error deleting stats cache:', error)
    // Don't throw here, as the book was successfully added
  }

  return data
}

// Update a book
export async function updateBook(userId: string, bookId: string, updates: Partial<Book>): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId)
    .eq('userId', userId)
  
  if (error) {
    console.error('Error updating book:', error)
  }
  
  // Delete stats cache to force recalculation
  await supabase
    .from('reading_stats')
    .delete()
    .eq('userId', userId)
}

// Delete a book
export async function deleteBook(userId: string, bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('userId', userId)
  
  if (error) {
    console.error('Error deleting book:', error)
    throw new Error(error.message)
  }
  
  // Delete stats cache
  await supabase
    .from('reading_stats')
    .delete()
    .eq('userId', userId)
}
