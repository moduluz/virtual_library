import { supabase } from './supabase'

async function ensureBucketExists() {
  try {
    // First check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === 'books-pdf')
    
    if (!bucketExists) {
      console.log('Creating books-pdf bucket...')
      const { error } = await supabase.storage.createBucket('books-pdf', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['application/pdf']
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        // If bucket already exists or we don't have permission, continue
        if (error.message.includes('already exists') || error.message.includes('permission denied')) {
          console.log('Bucket may already exist or we lack permissions, continuing...')
          return
        }
        throw new Error('Failed to create storage bucket')
      }
    }
  } catch (error) {
    console.error('Error in ensureBucketExists:', error)
    // If we get a permission error, continue anyway as the bucket might exist
    if (error instanceof Error && error.message.includes('permission denied')) {
      console.log('Permission denied, but continuing as bucket might exist...')
      return
    }
    throw new Error('Failed to ensure storage bucket exists')
  }
}

export async function uploadBookPDF(file: File, userId: string, bookId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  console.log('Starting PDF upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId,
    bookId
  })

  // Ensure bucket exists
  await ensureBucketExists()

  // Create a unique file name using a timestamp to prevent collisions
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${bookId}_${timestamp}.${fileExt}`

  console.log('Uploading to path:', fileName)

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('books-pdf')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading PDF:', {
        error,
        fileName,
        userId,
        bookId
      })
      throw new Error(`Failed to upload PDF: ${error.message}`)
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('books-pdf')
      .getPublicUrl(fileName)

    console.log('Generated public URL:', publicUrl)

    return publicUrl
  } catch (error) {
    console.error('Unexpected error during PDF upload:', error)
    throw error
  }
}

export async function deleteBookPDF(userId: string, bookId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }

  // Ensure bucket exists
  await ensureBucketExists()

  try {
    // List files in the user's directory
    const { data: files, error: listError } = await supabase.storage
      .from('books-pdf')
      .list(`${userId}`)

    if (listError) {
      console.error('Error listing files:', listError)
      throw new Error('Failed to list PDF files')
    }

    // Find files that match the bookId pattern
    const filesToDelete = files
      .filter(file => file.name.startsWith(`${bookId}_`))
      .map(file => `${userId}/${file.name}`)

    if (filesToDelete.length === 0) {
      console.log('No PDF files found to delete')
      return
    }

    console.log('Deleting PDFs:', filesToDelete)

    const { error: deleteError } = await supabase.storage
      .from('books-pdf')
      .remove(filesToDelete)

    if (deleteError) {
      console.error('Error deleting PDFs:', {
        error: deleteError,
        filesToDelete,
        userId,
        bookId
      })
      throw new Error(`Failed to delete PDFs: ${deleteError.message}`)
    }

    console.log('PDFs deleted successfully')
  } catch (error) {
    console.error('Unexpected error during PDF deletion:', error)
    throw error
  }
} 