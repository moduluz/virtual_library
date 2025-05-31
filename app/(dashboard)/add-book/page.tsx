"use client"

import { useState } from "react"
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

function normalizeRating(rating: unknown): number | null {
  if (typeof rating === "string") {
    return rating.trim() === "" ? null : Number(rating);
  }
  if (rating === undefined || rating === null) {
    return null;
  }
  return Number(rating);
}

export default function AddBookPage() {
  const { user } = useUser()
  const { getToken } = useAuth();
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      coverUrl: "",
      description: "",
      genre: "",
      status: "want-to-read",
      notes: "",
    },
  })

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Error",
          description: "Only PDF files are allowed",
          variant: "destructive",
        })
        return
      }
      form.setValue("pdfFile", file)
      setPdfPreview(URL.createObjectURL(file))
    }
  }

  async function onSubmit(data: BookFormValues) {
    if (!user) return

    setIsSubmitting(true)

    try {
      // First, create the book without PDF
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          rating: normalizeRating(data.rating),
          pdfFile: undefined, // Remove the file from the JSON
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to add book")
      }

      const book = responseData

      // If there's a PDF file, upload it
      if (data.pdfFile) {
        try {
          const token = await getToken();
          if (!token) {
            throw new Error("Failed to get authentication token");
          }
          await uploadBookPDF(data.pdfFile, book.id, token)
          const pdfUrl = await getBookPDFUrl(book.id, token)
          
          // Update the book with the PDF URL
          const updateResponse = await fetch(`/api/books/${book.id}`, {
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
            description: "Book was added but PDF upload failed. You can try uploading the PDF later.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Book added",
        description: `${data.title} has been added to your library.`,
      })

      router.push("/books")
      router.refresh()
    } catch (error) {
      console.error("Error adding book:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add book. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add a New Book</CardTitle>
          <CardDescription>Add details about a book to your personal library</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Author name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Book"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
