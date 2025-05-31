import { getBrowserClient } from './supabase'
import type { FileObject } from '@supabase/storage-js'

const supabase = getBrowserClient()

async function ensureBucketExists() {
  try {
    // First check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === 'books-pdf')
    
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

export async function uploadBookPDF(file: File, bookId: string, token?: string) {
  try {
    const bucketName = 'books-pdf'
    const supabase = getBrowserClient(token);
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    console.log('Starting PDF upload:', {
      bucketName,
      fileName,
      fileSize: file.size,
      fileType: file.type
    })

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload PDF: ${error.message}`)
    }

    console.log('File uploaded successfully:', data)
    return data
  } catch (error) {
    console.error('Error in uploadBookPDF:', error)
    throw error
  }
}

export async function getBookPDFUrl(bookId: string, token?: string) {
  try {
    const bucketName = 'books-pdf'
    const supabase = getBrowserClient(token);
    console.log('Getting PDF URL for book:', bookId)
    // List files to find the book's PDF
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        search: bookId
      })

    if (listError) {
      console.error('Error listing files:', listError)
      throw new Error(`Failed to list files: ${listError.message}`)
    }

    console.log('Found files:', files)

    const bookFile = files?.find((file: { name: string }) => file.name.includes(bookId))
    
    if (!bookFile) {
      console.log('No PDF found for book:', bookId)
      return null
    }

    // Get public URL for the file
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(bookFile.name)

    console.log('Generated public URL:', data.publicUrl)
    return data.publicUrl
  } catch (error) {
    console.error('Error getting PDF URL:', error)
    throw error
  }
}

export async function deleteBookPDF(bookId: string, token?: string) {
  try {
    const bucketName = 'books-pdf'
    const supabase = getBrowserClient(token);
    console.log('Deleting PDF for book:', bookId)
    // List files to find the book's PDF
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        search: bookId
      })

    if (listError) {
      console.error('Error listing files:', listError)
      throw new Error(`Failed to list files: ${listError.message}`)
    }

    const bookFile = files?.find((file: { name: string }) => file.name.includes(bookId))
    
    if (!bookFile) {
      console.log('No PDF found to delete for book:', bookId)
      return true // File doesn't exist, consider it deleted
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([bookFile.name])

    if (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete PDF: ${error.message}`)
    }

    console.log('PDF deleted successfully for book:', bookId)
    return true
  } catch (error) {
    console.error('Error deleting PDF:', error)
    throw error
  }
} 