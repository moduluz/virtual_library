import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test database connection
    const { data, error } = await supabase
      .from('books')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database test failed:', error)
      return false
    }
    
    console.log('Database connection successful')
    
    // Test storage connection
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.error('Storage test failed:', storageError)
      return false
    }
    
    console.log('Storage connection successful, buckets:', buckets)
    return true
    
  } catch (error) {
    console.error('Supabase test failed:', error)
    return false
  }
}