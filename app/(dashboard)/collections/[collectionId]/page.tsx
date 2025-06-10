import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getCollectionById } from "@/lib/collection-service";
import { getBooksInCollection, getAllBooksForUser } from "@/lib/book-service"; // Ensure getAllBooksForUser is imported
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import { Collection, Book } from "@/types";

interface CollectionDetailPageProps {
  params: { collectionId: string };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { collectionId } = params;
  const user = await currentUser();

  if (!user || !user.id) {
    redirect("/sign-in");
  }

  const collection: Collection | null = await getCollectionById(user.id, collectionId);

  if (!collection) {
    notFound();
  }

  const booksInCollection: Book[] = await getBooksInCollection(user.id, collection.bookIds || []);
  const allUserBooks: Book[] = await getAllBooksForUser(user.id); // <<< FETCH ALL USER BOOKS

  return (
    <CollectionDetailClient
      collection={collection}
      booksInCollection={booksInCollection}
      allUserBooks={allUserBooks} // <<< PASS IT HERE
    />
  );
}