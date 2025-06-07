'use client'
import React from 'react'

interface PDFInfoSectionProps {
  pdfUrl?: string
}

export default function PDFInfoSection({ pdfUrl }: PDFInfoSectionProps) {
  if (!pdfUrl) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h3 className="text-sm font-medium text-blue-800 mb-2">📄 PDF File</h3>
      <p className="text-blue-600 text-sm">This book has a PDF file attached.</p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline text-sm"
      >
        View PDF →
      </a>
    </div>
  )
}