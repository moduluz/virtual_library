"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Collection } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter, 
  CardContent 
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent Link navigation
    event.preventDefault();
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collection');
      }

      toast({
        title: 'Collection Deleted',
        description: `"${collection.name}" has been successfully deleted.`,
      });
      
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not delete collection.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/collections/${collection.id}`} passHref legacyBehavior>
      <a className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group h-full text-card-foreground no-underline">
        <Card className="flex flex-col h-full cursor-pointer group-hover:shadow-md transition-shadow duration-150 ease-in-out">
          <CardHeader className="pb-2">
            <div className="flex items-start">
              {collection.color && (
                <div
                  className="w-3 h-3 rounded-full mt-1 mr-2 flex-shrink-0"
                  style={{ backgroundColor: collection.color }}
                />
              )}
              <div className="flex-grow min-w-0">
                <CardTitle className="text-lg font-semibold break-words group-hover:text-primary transition-colors">
                  {collection.name}
                </CardTitle>
              </div>
            </div>
            {collection.description && (
              <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2 h-10">
                {collection.description}
              </CardDescription>
            )}
            {!collection.description && (
                <div className="h-10"><p className="text-sm text-muted-foreground italic mt-1">No description</p></div>
            )}
          </CardHeader>
          <CardContent className="flex-grow pt-2 pb-3">
            <p className="text-xs text-muted-foreground">
              {collection.bookIds?.length || 0} book{collection.bookIds?.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
          <CardFooter className="pt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  aria-label={`Remove collection ${collection.name}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Remove'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    collection "{collection.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel 
                    disabled={isDeleting} 
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isDeleting} 
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}