"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AddBooksToCollectionModal } from "./AddBooksToCollectionModal";
import { Collection, Book } from "@/types";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { BookDisplay } from "@/components/book-display"; // Import BookDisplay

interface CollectionDetailClientProps {
  collection: Collection;
  booksInCollection: Book[];
  allUserBooks: Book[];
}

// Define the allowed statuses for BookDisplay and a type for them
const ALLOWED_BOOK_DISPLAY_STATUSES = ["reading", "completed", "want-to-read"] as const;
type BookDisplayStatus = typeof ALLOWED_BOOK_DISPLAY_STATUSES[number];

/**
 * Maps a book's status to a valid status expected by BookDisplay.
 * If the input status is not one of the allowed values, or is null/undefined,
 * it defaults to "want-to-read".
 */
function mapToBookDisplayStatus(originalStatus: string | null | undefined): BookDisplayStatus {
  if (originalStatus && ALLOWED_BOOK_DISPLAY_STATUSES.includes(originalStatus as BookDisplayStatus)) {
    return originalStatus as BookDisplayStatus;
  }
  // Default to "want-to-read" if the status is not valid or not present.
  // You might want to adjust this default based on your application's logic.
  return "want-to-read";
}

export default function CollectionDetailClient({
  collection,
  booksInCollection,
  allUserBooks,
}: CollectionDetailClientProps) {
  const [isAddBooksModalOpen, setIsAddBooksModalOpen] = useState(false);
  const router = useRouter();

  const handleBooksAdded = () => {
    router.refresh();
  };

  const handleBookRemovedFromCollection = (bookId: string) => {
    console.log(`Book ${bookId} removed, refreshing...`);
    router.refresh();
  };

  const booksForDisplay = booksInCollection.map((book) => {
    // Check your `@/types` Book definition. 
    // If publisher, averageRating, ratingsCount are not there, remove them from this mapping.
    // If BookDisplay *requires* them, then the Book type in `@/types` needs to be updated,
    // or BookDisplay needs to handle their absence.

    // For the 'rating' property, ensure it's number | null.
    // If book.rating can be undefined, map it to null.
    let displayRating: number | null = null;
    if (typeof book.rating === 'number') {
      displayRating = book.rating;
    } else if (book.rating === null) {
      displayRating = null;
    }

    let displayDateAdded: string;
    if (book.dateAdded instanceof Date) {
      displayDateAdded = book.dateAdded.toISOString(); // Convert Date to ISO string
    } else if (typeof book.dateAdded === 'string') {
      displayDateAdded = book.dateAdded;
    } else {
      // Fallback if dateAdded is unexpectedly undefined or another type
      // Given DB schema (NOT NULL), this should ideally not be hit.
      displayDateAdded = new Date().toISOString(); 
      console.warn(`Book with id ${book.id} had an unexpected dateAdded value:`, book.dateAdded);
    }

    return {
      ...book,
      // Ensure all properties match BookDisplay's expected types
      isbn: book.isbn === null ? undefined : book.isbn,
      coverUrl: book.coverUrl === null ? undefined : book.coverUrl,
      description: book.description === null ? undefined : book.description,
      genre: book.genre === null ? undefined : book.genre,
      pageCount: book.pageCount === null ? undefined : book.pageCount,
      publishedDate: book.publishedDate === null ? undefined : book.publishedDate,
      // Remove these lines if 'publisher', 'averageRating', 'ratingsCount' are not on your source Book type
      // publisher: book.publisher === null ? undefined : book.publisher, 
      // averageRating: book.averageRating === null ? undefined : book.averageRating,
      // ratingsCount: book.ratingsCount === null ? undefined : book.ratingsCount,
      pdf_url: book.pdf_url === null ? undefined : book.pdf_url,
      notes: book.notes === null ? undefined : book.notes, // Ensure notes is string | undefined
      status: mapToBookDisplayStatus(book.status),
      rating: displayRating, // Use the explicitly typed rating
      dateAdded: displayDateAdded, // Ensure dateAdded is a string
    };
  });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Link href="/collections" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Collections
      </Link>

      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div
            className="w-5 h-5 rounded-full mr-3 flex-shrink-0"
            style={{ backgroundColor: collection.color || "#007bff" }}
          />
          <div>
            <h1 className="text-3xl font-bold break-all">{collection.name}</h1>
            <p className="text-muted-foreground">
              {collection.description || "No description."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {booksInCollection.length} book{booksInCollection.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={() => setIsAddBooksModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Books
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Books in this Collection</h2>
      {booksForDisplay && booksForDisplay.length > 0 ? (
        // Use the BookDisplay component to render the books
        // This component already handles linking to /books/${book.id}
        <BookDisplay books={booksForDisplay} displayType="grid" />
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          {/* You can use an SVG icon here if you have one */}
          <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            No books in this collection
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add books to this collection to see them here.
          </p>
        </div>
      )}

      <AddBooksToCollectionModal
        isOpen={isAddBooksModalOpen}
        onOpenChange={setIsAddBooksModalOpen}
        collection={collection}
        allUserBooks={allUserBooks}
        onBooksAdded={handleBooksAdded}
      />
    </div>
  );
}