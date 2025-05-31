"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download } from "lucide-react"

interface PDFViewerProps {
  pdfUrl: string
  title: string
}

export function PDFViewer({ pdfUrl, title }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            View PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={title}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  )
} 