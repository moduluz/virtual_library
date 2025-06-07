import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase, createClerkSupabaseClient } from '@/lib/supabase'; 

interface Book {
  id: string
  userId: string
  title: string
  author: string
  isbn?: string
  coverUrl?: string
  description?: string
  genre?: string
  pageCount?: number
  publishedDate?: string
  status: 'want-to-read' | 'reading' | 'completed'
  rating?: number
  notes?: string
  dateAdded: string
  pdf_url?: string
}

export function useBookEdit(bookId: string) {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth(); // Ensure getToken is destructured here
  
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    description: '',
    genre: '',
    pageCount: '',
    publishedDate: '',
    status: 'want-to-read' as const,
    rating: '',
    notes: ''
  })

  const fetchBook = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('userId', user?.id)
        .single()

      if (error) throw error
      
      setBook(data)
      setFormData({
        title: data.title || '',
        author: data.author || '',
        isbn: data.isbn || '',
        coverUrl: data.coverUrl || '',
        description: data.description || '',
        genre: data.genre || '',
        pageCount: data.pageCount?.toString() || '',
        publishedDate: data.publishedDate || '',
        status: data.status || 'want-to-read',
        rating: data.rating?.toString() || '',
        notes: data.notes || ''
      })
    } catch (error) {
      console.error('Error fetching book:', error)
      alert('Failed to load book')
      router.push('/books')
    } finally {
      setLoading(false)
    }
  }

  const uploadPdf = async (file: File): Promise<string | undefined> => {
    console.log('[useBookEdit] uploadPdf: Function called.'); // Log 1

    if (!user) {
      console.error('[useBookEdit] uploadPdf: User object is missing!');
      return undefined;
    }
    if (!book) {
      console.error('[useBookEdit] uploadPdf: Book object is missing!');
      return undefined;
    }
    if (!getToken) {
      console.error('[useBookEdit] uploadPdf: getToken function from useAuth is missing!');
      return undefined;
    }

    console.log('[useBookEdit] uploadPdf: User, book, and getToken are present.'); // Log 2

    try {
      console.log('[useBookEdit] uploadPdf: Attempting to create Supabase client with Clerk token...'); // Log 3
      const supabaseClient = createClerkSupabaseClient(getToken);
      console.log('[useBookEdit] uploadPdf: supabaseClient with Clerk token created (or function called).'); // Log 4

      const fileName = `${user.id}-${book.id}.pdf`;
      console.log(`[useBookEdit] uploadPdf: Uploading ${fileName} to books-pdf...`); // Log 5
      
      const { data, error } = await supabaseClient.storage
        .from('books-pdf')
        .upload(fileName, file, {
          upsert: true,
          contentType: 'application/pdf'
        });

      if (error) {
        console.error('[useBookEdit] uploadPdf: Supabase storage upload error:', error); // Log 6 (error)
        throw error;
      }

      console.log('[useBookEdit] uploadPdf: Upload successful. Getting public URL...'); // Log 7
      const { data: urlData } = supabaseClient.storage
        .from('books-pdf')
        .getPublicUrl(fileName);

      console.log('[useBookEdit] uploadPdf: Public URL obtained:', urlData.publicUrl); // Log 8
      return urlData.publicUrl;
    } catch (error) {
      console.error('[useBookEdit] Error in uploadPdf function:', error); // Log 9 (catch block)
      throw error;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !book) return

    setSaving(true)
    try {
      let pdfUrl = book.pdf_url

      // Upload new PDF if selected using API route
      if (selectedPdfFile) {
        const newPdfUrl = await uploadPdf(selectedPdfFile)
        if (newPdfUrl) {
          pdfUrl = newPdfUrl
        }
      }

      const updateData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || null,
        coverUrl: formData.coverUrl.trim() || null,
        description: formData.description.trim() || null,
        genre: formData.genre.trim() || null,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        publishedDate: formData.publishedDate.trim() || null,
        status: formData.status,
        rating: formData.rating ? parseInt(formData.rating) : null,
        notes: formData.notes.trim() || null,
        pdf_url: pdfUrl || undefined
      }

      const { error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('userId', user.id)

      if (error) throw error

      alert(selectedPdfFile ? 'Book and PDF updated successfully!' : 'Book updated successfully!')
      router.push('/books')
    } catch (error: any) {
      console.error('Error updating book:', error)
      alert(error.message || 'Failed to update book')
    } finally {
      setSaving(false)
    }
  }

  const handlePdfUpload = (file: File) => {
    setSelectedPdfFile(file)
  }

  const handleDelete = async () => {
    if (!user || !book || !deleteConfirm) return

    try {
      // Delete PDF if exists
      if (book.pdf_url) {
        const fileName = `${user.id}-${book.id}.pdf`
        await supabase.storage
          .from('books-pdf')
          .remove([fileName])
      }

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('userId', user.id)

      if (error) throw error

      alert('Book deleted successfully!')
      router.push('/books')
    } catch (error: any) {
      console.error('Error deleting book:', error)
      alert(error.message || 'Failed to delete book')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (user) {
      fetchBook()
    }
  }, [bookId, user])

  return {
    book,
    loading,
    saving,
    deleteConfirm,
    formData,
    selectedPdfFile,
    setDeleteConfirm,
    handleSubmit,
    handleDelete,
    handleInputChange,
    handlePdfUpload,
    router
  }
}