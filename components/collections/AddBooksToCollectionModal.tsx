'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation'; // << IMPORT THIS
import { Book, Collection } from '@/types'; // Ensure this import

export interface AddBooksToCollectionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  collection: Collection; // Changed to expect the whole collection object
  allUserBooks: Book[]; // Uses the imported Book type
  onBooksAdded: () => void;
}

export function AddBooksToCollectionModal({
  isOpen,
  onOpenChange,
  collection, // Now receiving the whole collection object
  allUserBooks,
  onBooksAdded,
}: AddBooksToCollectionModalProps) {
  const router = useRouter();
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out books already in the collection
  const booksAvailableToAdd = useMemo(() => {
    const currentBookIdsInCollection = collection.bookIds || []; // <<< USE collection.bookIds
    return allUserBooks.filter(book => !currentBookIdsInCollection.includes(book.id));
  }, [allUserBooks, collection.bookIds]); // <<< USE collection.bookIds

  // Filter books based on search term
  const filteredBooks = booksAvailableToAdd.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleAddBooksToCollection = async () => {
    if (selectedBookIds.length === 0) {
      toast({
        title: "No books selected",
        description: "Please select at least one book to add.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIdsToAdd: selectedBookIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add books to collection");
      }

      toast({
        title: "Success!",
        description: "Books added to the collection.",
      });
      
      setSelectedBookIds([]); // Clear selection
      onOpenChange(false); // Close the modal

      // Option 1: Call a prop passed from the parent if it handles refresh
      // onBooksAdded(); 

      // Option 2 (Recommended & More Direct): Refresh the current route's data
      router.refresh(); // << THIS WILL RE-FETCH SERVER COMPONENT DATA

    } catch (error: any) {
      console.error("Error adding books to collection:", error);
      toast({
        title: "Error",
        description: error.message || "Could not add books to the collection.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Books to "{collection.name}"</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Books Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No books match your search
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBookIds.includes(book.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelectBook(book.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedBookIds.includes(book.id)}
                        onChange={() => handleSelectBook(book.id)}
                      />
                      <div className="w-12 h-16 relative flex-shrink-0">
                        <Image
                          src={book.coverUrl || `/placeholder.svg?height=64&width=48&text=${encodeURIComponent(book.title)}`}
                          alt={book.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                        <p className="text-muted-foreground text-xs mt-1">{book.author}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedBookIds.length} book{selectedBookIds.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBooksToCollection}
              disabled={isSubmitting || selectedBookIds.length === 0}
            >
              Add {selectedBookIds.length > 0 && `${selectedBookIds.length} `}Books
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}