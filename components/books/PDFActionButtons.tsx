'use client'

import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface PDFActionButtonsProps {
  pdfUrl: string
  bookTitle: string
}

export function PDFActionButtons({ pdfUrl, bookTitle }: PDFActionButtonsProps) {
  const handleReadPDF = () => {
    window.open(pdfUrl, '_blank')
  }

  const handleDownloadPDF = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${bookTitle}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleReadPDF}
      >
        <FileText className="w-4 h-4 mr-2" />
        Read PDF
      </Button>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleDownloadPDF}
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
    </>
  )
}