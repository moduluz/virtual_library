'use client'
import React from 'react'
import { Star } from 'lucide-react'
import { useBookEdit } from '@/hooks/useBookEdit'
import BookEditForm from '@/components/books/BookEditForm'
import DeleteBookSection from '@/components/books/DeleteBookSection'

function normalizeRating(rating: unknown): number | null {
  if (rating === undefined || rating === null || rating === "") {
    return null;
  }
  const num = Number(rating);
  if (isNaN(num) || num < 0 || num > 5) {
    return null;
  }
  return num;
}

// StarRating component for selecting a rating
function StarRating({ value, onChange }: { value: number | null, onChange: (val: number) => void }) {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          type="button"
          key={i}
          onClick={() => onChange(i + 1)}
          onMouseDown={e => e.preventDefault()}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${value !== null && i < value ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
            fill={value !== null && i < value ? "#facc15" : "none"}
          />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(0)}
        className="ml-2 text-xs text-muted-foreground underline"
        onMouseDown={e => e.preventDefault()}
      >
        Clear
      </button>
    </div>
  )
}

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const {
    book,
    loading,
    saving,
    deleteConfirm,
    formData,
    setDeleteConfirm,
    handleSubmit,
    handleDelete,
    handleInputChange,
    handlePdfUpload,
    router
  } = useBookEdit(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Book not found</h2>
          <button
            onClick={() => router.push('/books')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Books
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold">Edit Book</h1>
          <p className="text-blue-100 mt-2">Update your book information and upload/replace PDF</p>
        </div>

        {/* Form with PDF Upload */}
        <BookEditForm
          formData={formData}
          loading={loading}
          saving={saving}
          currentPdfUrl={book.pdf_url}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/books')}
          onPdfUpload={handlePdfUpload}
        />

        {/* Delete Section */}
        <div className="p-6 pt-0">
          <DeleteBookSection
            deleteConfirm={deleteConfirm}
            onToggleConfirm={() => setDeleteConfirm(!deleteConfirm)}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}