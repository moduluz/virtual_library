import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Book {
  id: string
  userId: string
  title: string
  author: string
  isbn?: string | null
  coverUrl?: string | null
  description?: string | null
  genre?: string | null
  pageCount?: number | null
  publishedDate?: string | null
  status: 'want-to-read' | 'reading' | 'completed'
  rating?: number | null
  notes?: string | null
  dateAdded: string
  pdfUrl?: string | null
}

export function useBookEdit(bookId: string) {
  const router = useRouter();
  const { data: session } = useSession();

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
    status: 'want-to-read' as 'want-to-read' | 'reading' | 'completed',
    rating: '',
    notes: ''
  })

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${bookId}`)
      if (!response.ok) {
        throw new Error('Book not found')
      }
      const data: Book = await response.json()

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
        status: (data.status as 'want-to-read' | 'reading' | 'completed') || 'want-to-read',
        rating: data.rating?.toString() || '',
        notes: data.notes || ''
      })
    } catch (error) {
      console.error('Error fetching book:', error)
      router.push('/books')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user || !book) return

    setSaving(true)
    try {
      // If there's a new PDF, upload it first
      let pdfUrl = book.pdfUrl

      if (selectedPdfFile) {
        const formDataToSend = new FormData()
        formDataToSend.append('file', selectedPdfFile)
        // Re-use the upload-pdf route but just for PDF upload part
        // We'll pass existing book data so a new record isn't created
        formDataToSend.append('bookData', JSON.stringify({
          title: formData.title.trim(),
          author: formData.author.trim(),
          // flag to indicate this is an update, not a new book
          _existingBookId: bookId,
        }))
        
        // Use the direct PDF upload API
        const uploadRes = await fetch(`/api/books/${bookId}/upload-pdf`, {
          method: 'POST',
          body: formDataToSend,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          pdfUrl = uploadData.pdfUrl
        }
        // If upload fails, we still proceed with other updates
      }

      const updateData: any = {
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
      }

      if (pdfUrl !== book.pdfUrl) {
        updateData.pdfUrl = pdfUrl
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update book')
      }

      router.push(`/books/${bookId}`)
      router.refresh()
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
    if (!session?.user || !book || !deleteConfirm) return

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete book')
      }

      router.push('/books')
      router.refresh()
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
    if (session?.user) {
      fetchBook()
    }
  }, [bookId, session])

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