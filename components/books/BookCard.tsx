// filepath: C:/JavaScript/library-app/components/books/BookCard.tsx
"use client"; // Add if you plan to use client-side hooks or event handlers

import React from 'react';
import { Book } from '@/types'; // Assuming your Book type is in @/types
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Example using Shadcn Card
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react'; // For a remove button example

interface BookCardProps {
  book: Book;
  showRemoveFromCollectionButton?: boolean;
  collectionId?: string;
  onBookRemoved?: (bookId: string) => void; // Callback when a book is removed
}

export function BookCard({ book, showRemoveFromCollectionButton, collectionId, onBookRemoved }: BookCardProps) {
  
  const handleRemoveFromCollection = async () => {
    if (!collectionId || !onBookRemoved) return;
    // Add API call logic here to remove the book from the collection
    // For example:
    // try {
    //   const response = await fetch(`/api/collections/${collectionId}/books/${book.id}`, { method: 'DELETE' });
    //   if (!response.ok) throw new Error('Failed to remove book');
    //   onBookRemoved(book.id); // Notify parent to refresh or update state
    // } catch (error) {
    //   console.error("Error removing book from collection:", error);
    //   // Handle error (e.g., show toast)
    // }
    console.log(`Placeholder: Remove book ${book.id} from collection ${collectionId}`);
    onBookRemoved(book.id); // Simulate removal for now
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        {book.coverUrl ? (
          <div className="relative aspect-[2/3] w-full">
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover rounded-t-md"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-[2/3] w-full bg-secondary flex items-center justify-center rounded-t-md">
            <span className="text-muted-foreground text-sm">No Cover</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow pt-4">
        <CardTitle className="text-md font-semibold line-clamp-2">{book.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-1 mt-1">
          {book.author || 'Unknown Author'}
        </CardDescription>
      </CardContent>
      {showRemoveFromCollectionButton && collectionId && onBookRemoved && (
        <CardFooter>
          <Button variant="destructive" size="sm" className="w-full" onClick={handleRemoveFromCollection}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}