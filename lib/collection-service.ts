import { supabase, type Collection } from "./supabase"

// Get all collections for a user
export async function getCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('userId', userId)
  
  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }
  
  return data || []
}

// Get a single collection by ID
export async function getCollection(userId: string, collectionId: string): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('userId', userId)
    .eq('id', collectionId)
    .single()
  
  if (error) {
    console.error('Error fetching collection:', error)
    return null
  }
  
  return data
}

// Add a new collection
export async function addCollection(userId: string, collection: Omit<Collection, 'id' | 'userId' | 'dateCreated'>): Promise<Collection | null> {
  const newCollection: Collection = {
    ...collection,
    id: crypto.randomUUID(),
    userId,
    dateCreated: new Date().toISOString(),
  }
  
  const { error } = await supabase
    .from('collections')
    .insert(newCollection)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding collection:', error)
    return null
  }
  
  return newCollection
}

// Update a collection
export async function updateCollection(userId: string, collectionId: string, updates: Partial<Collection>): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .eq('userId', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating collection:', error)
    return null
  }
  
  return data
}

// Delete a collection
export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('userId', userId)
  
  if (error) {
    console.error('Error deleting collection:', error)
    return false
  }
  
  return true
}

export async function addBookToCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<Collection | null> {
  const collection = await getCollection(userId, collectionId)
  
  if (!collection) return null
  if (collection.bookIds.includes(bookId)) return collection
  
  collection.bookIds.push(bookId)
  return updateCollection(userId, collectionId, { bookIds: collection.bookIds })
}

export async function removeBookFromCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<Collection | null> {
  const collection = await getCollection(userId, collectionId)
  
  if (!collection) return null
  
  const newBookIds = collection.bookIds.filter(id => id !== bookId)
  return updateCollection(userId, collectionId, { bookIds: newBookIds })
}

export async function getCollectionById(userId: string, collectionId: string) {
  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('userId', userId)
    .single()

  if (error) {
    console.error('Error fetching collection:', error)
    return null
  }

  return collection
}
