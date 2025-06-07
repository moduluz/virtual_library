'use client'
import React from 'react'

interface DeleteBookSectionProps {
  deleteConfirm: boolean
  onToggleConfirm: () => void
  onDelete: () => void
}

export default function DeleteBookSection({ 
  deleteConfirm, 
  onToggleConfirm, 
  onDelete 
}: DeleteBookSectionProps) {
  return (
    <div className="mt-6 pt-6 border-t">
      <button
        type="button"
        onClick={onToggleConfirm}
        className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
      >
        {deleteConfirm ? 'Cancel Delete' : 'Delete Book'}
      </button>

      {deleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <p className="text-red-800 text-sm mb-3">
            ⚠️ Are you sure you want to delete this book? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              type="button"
              onClick={onToggleConfirm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}