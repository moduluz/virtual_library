"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Import DialogDescription
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

interface PDFViewerProps {
  pdfUrl: string
  title: string
  bookId: string;
}

export function PDFViewer({ pdfUrl, title, bookId }: PDFViewerProps) {
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [pagesReadInput, setPagesReadInput] = useState("");
  const wasPdfDialogOpenRef = useRef(false);

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

  const logReadingProgressAPI = async (pagesJustRead: number) => {
    if (pagesJustRead <= 0) {
      console.log("No new pages read to log.");
      return;
    }
    try {
      const currentDate = new Date().toISOString(); // Get current date in ISO format
      console.log('Sending to API:', { bookId, pagesRead: pagesJustRead, dateRead: currentDate }); // Updated log
      const response = await fetch('/api/log-daily-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: bookId,            // This is correct
          pagesRead: pagesJustRead,  // Changed from pagesReadCount to pagesRead
          dateRead: currentDate,     // Added dateRead
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to log reading progress:', response.status, errorData);
        alert(`Failed to log reading progress: ${errorData.error || 'Unknown error'}`);
      } else {
        const result = await response.json();
        console.log('Reading progress logged successfully:', result.message);
        // Consider removing the alert or making it more user-friendly if it's too intrusive
        alert('Reading progress logged!');
      }
    } catch (error) {
      console.error('Error calling log-daily-reading API:', error);
      alert('An error occurred while logging progress.');
    }
  };


  useEffect(() => {
    if (wasPdfDialogOpenRef.current && !isPdfDialogOpen) {
      setPagesReadInput("");
      setIsPromptOpen(true);
    }
    wasPdfDialogOpenRef.current = isPdfDialogOpen;
  }, [isPdfDialogOpen]);

  const handleSubmitPagesRead = () => {
    const pagesReadNum = parseInt(pagesReadInput, 10);
    if (!isNaN(pagesReadNum) && pagesReadNum > 0) {
      logReadingProgressAPI(pagesReadNum);
      setIsPromptOpen(false);
    } else if (pagesReadNum <= 0) {
      alert("Please enter a positive number of pages.");
    } else {
      alert("Invalid input. Please enter a number.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* PDF Viewer Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            View PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[1200px] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{title}</DialogTitle>
            {/* ADDED DialogDescription for PDF Viewer */}
            <DialogDescription className="sr-only">
              Displays the PDF content for the book: {title}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow w-full h-full overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={title} // iframe title is also important for accessibility
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Prompt Dialog for Pages Read */}
      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Reading Progress</DialogTitle>
            {/* ADDED DialogDescription for Prompt */}
            <DialogDescription>
              Enter the number of pages you read in your last session for the book "{title}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pagesRead" className="text-right col-span-4 pb-1">
                How many pages of "{title}" did you read?
              </Label>
              <Input
                id="pagesRead"
                type="number"
                value={pagesReadInput}
                onChange={(e) => setPagesReadInput(e.target.value)}
                className="col-span-4"
                placeholder="Enter a number"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitPagesRead}>
              Log Pages
            </Button>
          </DialogFooter>
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