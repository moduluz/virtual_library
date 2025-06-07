'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AddBookPage() {
  const router = useRouter()
  const { user } = useUser()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
      toast.success('PDF file selected')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Debug environment variables
    console.log('Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    })
    
    if (!selectedFile) {
      toast.error('Please select a PDF file to upload')
      return
    }

    if (!user) {
      toast.error('Please sign in to add books')
      return
    }

    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error('Title and author are required')
      return
    }

    setLoading(true)

    try {
      // Step 1: Insert book record first
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          userId: user.id,
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
          notes: formData.notes.trim() || null
        })
        .select('id')
        .single()

      if (bookError) {
        console.error('Book insert error:', bookError)
        throw new Error(`Failed to save book: ${bookError.message}`)
      }

      console.log('Book created with ID:', bookData.id)

      // Step 2: Upload PDF with simpler naming
      const fileExtension = selectedFile.name.split('.').pop()
      const fileName = `${user.id}-${bookData.id}.${fileExtension}`
      
      console.log('Uploading file with name:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('books-pdf')
        .upload(fileName, selectedFile, {
          upsert: true,
          contentType: 'application/pdf'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      console.log('File uploaded successfully:', uploadData)

      // Step 3: Get public URL and update book record
      const { data: urlData } = supabase.storage
        .from('books-pdf')
        .getPublicUrl(fileName)

      console.log('Public URL:', urlData.publicUrl)

      const { error: updateError } = await supabase
        .from('books')
        .update({ pdf_url: urlData.publicUrl })
        .eq('id', bookData.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw new Error(`Failed to update book with PDF URL: ${updateError.message}`)
      }

      toast.success('Book and PDF uploaded successfully!')
      router.push('/books')

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to add book')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/books')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Books
        </Button>
        <h1 className="text-3xl font-bold">Add New Book</h1>
        <p className="text-muted-foreground">Add a new book with PDF file to your virtual library.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Book Details & PDF Upload</CardTitle>
          <CardDescription>
            Enter the book information and upload the PDF file. Fields with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Upload Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">PDF File *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label
                      htmlFor="pdf-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? 'Change PDF' : 'Upload PDF'}
                    </Label>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024 / 1024 * 100) / 100} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    PDF files only, max 50MB
                  </p>
                </div>
              </div>
            </div>

            {/* Title and Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageCount">Page Count</Label>
                <Input
                  id="pageCount"
                  name="pageCount"
                  type="number"
                  value={formData.pageCount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Reading Status *</Label>
                <select 
                  name="status"
                  value={formData.status} 
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="want-to-read">Want to Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed</option> {/* Changed to match database */}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverUrl">Cover Image URL</Label>
              <Input
                id="coverUrl"
                name="coverUrl"
                type="url"
                value={formData.coverUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/book-cover.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="What's this book about?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Personal Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Your thoughts, quotes, or notes about this book..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !selectedFile || !formData.title.trim() || !formData.author.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Book...
                  </>
                ) : (
                  'Add Book & Upload PDF'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/books')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
