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
  const resolvedParams = use(params)
  const { user } = useUser()
  const { getToken } = useAuth();
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)

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

  useEffect(() => {
    const fetchBook = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/books/${resolvedParams.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch book")
        }

        const book = await response.json()
        setCurrentBook(book)
        
        // Set form values
        form.reset({
          title: book.title,
          author: book.author,
          isbn: book.isbn || "",
          coverUrl: book.coverUrl || "",
          description: book.description || "",
          genre: book.genre || "",
          pageCount: book.pageCount,
          publishedDate: book.publishedDate || "",
          status: book.status,
          rating: book.rating,
          notes: book.notes || "",
        })

        if (book.pdfUrl) {
          setPdfPreview(book.pdfUrl)
        }
      } catch (error) {
        console.error("Error fetching book:", error)
        toast({
          title: "Error",
          description: "Failed to load book details. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchBook()
  }, [user, resolvedParams.id, form])

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
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Book</CardTitle>
          <CardDescription>Update the details of your book</CardDescription>
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
    </div>
  )
} 