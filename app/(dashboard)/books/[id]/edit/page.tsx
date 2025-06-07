<<<<<<< HEAD
'use client'
import React from 'react'
import { useBookEdit } from '@/hooks/useBookEdit'
import BookEditForm from '@/components/books/BookEditForm'
import DeleteBookSection from '@/components/books/DeleteBookSection'
=======
"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadBookPDF, getBookPDFUrl } from "@/lib/storage-service"
import { Book } from "@/lib/supabase"
import { Star } from "lucide-react"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf"]

const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  coverUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  pdfFile: z.instanceof(File).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
  publishedDate: z.string().optional(),
  status: z.enum(["reading", "completed", "want-to-read"]),
  rating: z.coerce.number().min(0).max(5).optional(),
  notes: z.string().optional(),
})

type BookFormValues = z.infer<typeof bookFormSchema>
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551

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
<<<<<<< HEAD
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
=======
  const resolvedParams = use(params)
  const { user } = useUser()
  const { getToken } = useAuth();
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

<<<<<<< HEAD
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
=======
  async function onSubmit(data: BookFormValues) {
    if (!user) return

    setIsSubmitting(true)

    try {
      // Clean up the data before sending
      const cleanedData = {
        ...data,
        rating: normalizeRating(data.rating),
        pdfFile: undefined, // Remove the file from the JSON
      }

      // First, update the book without PDF
      const response = await fetch(`/api/books/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update book")
      }

      // If there's a new PDF file, upload it
      if (data.pdfFile) {
        try {
          const token = await getToken();
          if (!token) {
            throw new Error("Failed to get authentication token");
          }
          await uploadBookPDF(data.pdfFile, resolvedParams.id, token);
          const pdfUrl = await getBookPDFUrl(resolvedParams.id, token);
          // Update the book with the PDF URL
          const updateResponse = await fetch(`/api/books/${resolvedParams.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pdfUrl }),
          })

          if (!updateResponse.ok) {
            console.error("Failed to update book with PDF URL")
          }
        } catch (error) {
          console.error("Error uploading PDF:", error)
          toast({
            title: "Warning",
            description: "Book was updated but PDF upload failed. You can try uploading the PDF later.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Book updated",
        description: `${data.title} has been updated.`,
      })

      router.push(`/books/${resolvedParams.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating book:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update book. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentBook) {
    return <div>Loading...</div>
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551
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

<<<<<<< HEAD
        {/* Delete Section */}
        <div className="p-6 pt-0">
          <DeleteBookSection
            deleteConfirm={deleteConfirm}
            onToggleConfirm={() => setDeleteConfirm(!deleteConfirm)}
            onDelete={handleDelete}
          />
        </div>
      </div>
=======
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="ISBN (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>Link to the book cover image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="Fiction, Non-fiction, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pageCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Count</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Number of pages" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reading">Currently Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="want-to-read">Want to Read</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Book description" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your thoughts about this book" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Book PDF</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfChange}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a PDF version of the book (max 10MB)
                      {currentBook.pdfUrl && " - A PDF is already uploaded"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <StarRating value={field.value ?? 0} onChange={val => field.onChange(val === 0 ? null : val)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Book"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
>>>>>>> 2f75a4ed3c69e1c7f8d4bfb9879c4efa2a356551
    </div>
  )
}