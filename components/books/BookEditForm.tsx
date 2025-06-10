'use client'
import React, { useState } from 'react'

interface BookEditFormProps {
  formData: any
  loading: boolean
  saving: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  currentPdfUrl?: string
  onPdfUpload?: (file: File) => void
}

const GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Horror', 'Biography', 'History', 'Science', 'Technology',
  'Business', 'Self-Help', 'Philosophy', 'Religion', 'Travel', 'Cooking',
  'Art', 'Poetry', 'Drama', 'Comedy', 'Adventure', 'Young Adult',
  'Children', 'Education', 'Health', 'Sports', 'Politics', 'Other'
]

const STATUS_OPTIONS = [
  { value: 'want-to-read', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'completed', label: 'Completed' }
]

export default function BookEditForm({ 
  formData, 
  loading, 
  saving, 
  onInputChange, 
  onSubmit, 
  onCancel,
  currentPdfUrl,
  onPdfUpload
}: BookEditFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only')
        return
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('File size must be less than 50MB')
        return
      }
      setSelectedFile(file)
      if (onPdfUpload) {
        onPdfUpload(file)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      {/* PDF Upload Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📄 PDF File</h3>
        
        {currentPdfUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <div>
                <p className="text-sm text-green-600 font-medium">✅ PDF file attached</p>
                <a
                  href={currentPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  View current PDF →
                </a>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Replace with new PDF:
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full p-2 border rounded-md bg-white"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Upload PDF file:
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md bg-white"
            />
          </div>
        )}
        
        {selectedFile && (
          <div className="mt-2 text-sm text-green-600">
            ✅ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        
        <p className="text-xs text-gray-600 mt-2">
          Only PDF files allowed. Maximum size: 50MB
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter book title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={onInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter author name"
          />
        </div>
      </div>

      {/* ISBN and Genre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn}
            onChange={onInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter ISBN (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
          <select
            name="genre"
            value={formData.genre}
            onChange={onInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select genre</option>
            {GENRES.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cover URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image URL</label>
        <input
          type="url"
          name="coverUrl"
          value={formData.coverUrl}
          onChange={onInputChange}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter cover image URL (optional)"
        />
        {formData.coverUrl && (
          <div className="mt-2">
            <img
              src={formData.coverUrl}
              alt="Book cover preview"
              className="w-20 h-28 object-cover rounded border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter book description (optional)"
        />
      </div>

      {/* Page Count and Published Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Page Count</label>
          <input
            type="number"
            name="pageCount"
            value={formData.pageCount}
            onChange={onInputChange}
            min="1"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Number of pages"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Read On Date</label>
          <input
            type="date"
            name="readOnDate"
            value={formData.readOnDate}
            onChange={onInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Date you finished reading this book"
          />
        </div>
      </div>

      {/* Status and Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reading Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={onInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5 stars)</label>
          <select
            name="rating"
            value={formData.rating}
            onChange={onInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No rating</option>
            <option value="1">⭐ 1 Star</option>
            <option value="2">⭐⭐ 2 Stars</option>
            <option value="3">⭐⭐⭐ 3 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Personal Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add your thoughts, quotes, or notes about this book..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Updating...' : selectedFile ? 'Update Book & Upload PDF' : 'Update Book'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}