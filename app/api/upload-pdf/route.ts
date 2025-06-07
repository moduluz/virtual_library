import { NextRequest } from 'next/server'
import { currentUser } from "@clerk/nextjs/server"
import { createClient } from '@supabase/supabase-js'

// Use service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This key bypasses RLS
)

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bookData = JSON.parse(formData.get('bookData') as string)
    const userId = formData.get('userId') as string

    if (!file || !bookData || !userId) {
      return Response.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Validate file
    if (file.type !== 'application/pdf') {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      return Response.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Step 1: Insert book record
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .insert({
        userId: userId,
        ...bookData
      })
      .select('id')
      .single()

    if (bookError) {
      throw new Error(`Failed to create book: ${bookError.message}`)
    }

    // Step 2: Upload PDF using admin client (bypasses RLS)
    const fileName = `${userId}-${book.id}.pdf`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('books-pdf')
      .upload(fileName, file, {
        upsert: true,
        contentType: 'application/pdf'
      })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Step 3: Get public URL and update book
    const { data: urlData } = supabaseAdmin.storage
      .from('books-pdf')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', book.id)

    if (updateError) {
      throw new Error(`Failed to update book: ${updateError.message}`)
    }

    return Response.json({ 
      success: true, 
      book: { ...book, pdf_url: urlData.publicUrl }
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}