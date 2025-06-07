"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { supabase, createClerkSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload, FileText } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf"]

// Define the shape of your form data
interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  description: string;
  genre: string;
  pageCount: string; // Keep as string for form input, parse to number on submit
  publishedDate: string;
  status: 'want-to-read' | 'reading' | 'completed';
  rating: string; // Keep as string for form input, parse to number on submit
  notes: string;
}

export default function AddBookPage() {
  const { user } = useUser();
  const { getToken } = useAuth(); // For Clerk-authenticated Supabase client
  const router = useRouter(); // Declare router once

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    description: '',
    genre: '',
    pageCount: '',
    publishedDate: '',
    status: 'want-to-read',
    rating: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to add a book.');
      return;
    }
    if (!formData.title || !formData.author) {
      toast.error('Title and Author are required.');
      return;
    }

    setLoading(true);
    let pdfUrl: string | undefined = undefined;

    try {
      // 1. Upload PDF if selected (using Clerk-authenticated client)
      if (selectedFile) {
        const supabaseClientWithClerk = createClerkSupabaseClient(getToken);
        const fileName = `${user.id}-${Date.now()}-${selectedFile.name}`; // Unique file name
        const { data: uploadData, error: uploadError } = await supabaseClientWithClerk.storage
          .from('books-pdf') // Your PDF bucket
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false, // Or true if you want to overwrite
            contentType: selectedFile.type,
          });

        if (uploadError) {
          console.error('PDF Upload Error:', uploadError);
          toast.error(`PDF Upload Failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }
        
        const { data: urlData } = supabaseClientWithClerk.storage
          .from('books-pdf')
          .getPublicUrl(fileName);
        pdfUrl = urlData?.publicUrl;
      }

      // 2. Create book record in Supabase
      const bookDataToInsert = {
        userId: user.id,
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || null,
        coverUrl: formData.coverUrl.trim() || null,
        description: formData.description.trim() || null,
        genre: formData.genre.trim() || null,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
        publishedDate: formData.publishedDate.trim() || null,
        status: formData.status,
        rating: formData.rating ? parseInt(formData.rating) : null,
        notes: formData.notes.trim() || null,
        pdf_url: pdfUrl, // Add the PDF URL here
        dateAdded: new Date().toISOString(),
      };

      // Use the plain Supabase client for database insert, RLS will apply based on JWT
      const { data: bookInsertData, error: bookInsertError } = await supabase
        .from('books')
        .insert([bookDataToInsert])
        .select()
        .single();

      if (bookInsertError) {
        console.error('Book Insert Error:', bookInsertError);
        toast.error(`Failed to add book: ${bookInsertError.message}`);
        // If book insert fails after PDF upload, you might want to delete the orphaned PDF
        if (pdfUrl && selectedFile) {
            const supabaseClientWithClerk = createClerkSupabaseClient(getToken);
            const fileName = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1);
            await supabaseClientWithClerk.storage.from('books-pdf').remove([fileName]);
            console.log("Orphaned PDF deleted after failed book insert.");
        }
        setLoading(false);
        return;
      }

      toast.success('Book added successfully!');
      setSelectedFile(null); // Clear selected file
      setFormData({ // Reset form
        title: '', author: '', isbn: '', coverUrl: '', description: '',
        genre: '', pageCount: '', publishedDate: '', status: 'want-to-read',
        rating: '', notes: '',
      });
      router.push(`/books/${bookInsertData.id}`); // Navigate to the new book's page

    } catch (error: any) {
      console.error('Error adding book:', error);
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Back Button */}
      <Link href="/books" className="mb-4 inline-flex items-center text-blue-600 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Books
      </Link>
      <h1 className="text-2xl font-bold mb-6">Add New Book</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className="mt-1" />
        </div>

        {/* Author Field */}
        <div>
          <Label htmlFor="author">Author</Label>
          <Input type="text" name="author" id="author" value={formData.author} onChange={handleInputChange} required className="mt-1" />
        </div>
        
        {/* PDF Upload Field */}
        <div className="space-y-2">
            <Label htmlFor="pdfFile">Book PDF (Optional)</Label>
            <div className="flex items-center space-x-2">
                <Label htmlFor="pdfFile" className="flex items-center px-4 py-2 bg-white text-blue-500 rounded-md shadow-sm tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                    <Upload className="mr-2 h-5 w-5" />
                    <span>Select PDF</span>
                    <Input id="pdfFile" name="pdfFile" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </Label>
                {selectedFile && (
                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700 text-xs">Clear</button>
                    </div>
                )}
            </div>
            {selectedFile && <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>


        {/* ISBN Field */}
        <div>
          <Label htmlFor="isbn">ISBN</Label>
          <Input type="text" name="isbn" id="isbn" value={formData.isbn} onChange={handleInputChange} className="mt-1" />
        </div>

        {/* Cover URL Field */}
        <div>
          <Label htmlFor="coverUrl">Cover Image URL</Label>
          <Input type="url" name="coverUrl" id="coverUrl" value={formData.coverUrl} onChange={handleInputChange} className="mt-1" />
        </div>
        
        {/* Description Field */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={4} className="mt-1" />
        </div>

        {/* Genre Field */}
        <div>
          <Label htmlFor="genre">Genre</Label>
          <Input type="text" name="genre" id="genre" value={formData.genre} onChange={handleInputChange} className="mt-1" />
        </div>

        {/* Page Count Field */}
        <div>
          <Label htmlFor="pageCount">Page Count</Label>
          <Input type="number" name="pageCount" id="pageCount" value={formData.pageCount} onChange={handleInputChange} className="mt-1" />
        </div>

        {/* Published Date Field */}
        <div>
          <Label htmlFor="publishedDate">Published Date</Label>
          <Input type="date" name="publishedDate" id="publishedDate" value={formData.publishedDate} onChange={handleInputChange} className="mt-1" />
        </div>

        {/* Status Field */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="want-to-read">Want to Read</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating Field */}
        <div>
          <Label htmlFor="rating">Rating (1-5)</Label>
          <Input type="number" name="rating" id="rating" value={formData.rating} onChange={handleInputChange} min="1" max="5" step="1" className="mt-1" />
        </div>

        {/* Notes Field */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="mt-1" />
        </div>

        <Button type="submit" disabled={loading || !formData.title || !formData.author} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Book...
            </>
          ) : (
            'Add Book'
          )}
        </Button>
      </form>
    </div>
  );
}
