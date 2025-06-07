import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // ✅ Await the params promise
    
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 404 })
    }

    return Response.json(book)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // ✅ Await the params promise
    const body = await request.json()
    
    const { data: book, error } = await supabase
      .from('books')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(book)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // ✅ Await the params promise
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ message: 'Book deleted successfully' })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
