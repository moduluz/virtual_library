import { getBooksInCollection, getAllBooksForUser } from "@/lib/book-service";
import { getCollectionById } from "@/lib/collection-service";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Collection, Book } from "@/types";

interface CollectionDetailPageProps {
  params: { collectionId: string }; // Or Promise<{ collectionId: string }> if Next.js version implies
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  // Await the params object itself before destructuring
  const resolvedParams = await params;
  const { collectionId } = resolvedParams;

  const user = await currentUser();

  if (!user || !user.id) {
    redirect("/sign-in");
    return null;
  }

  // Ensure getCollectionById and other service functions are correctly implemented
  const collection: Collection | null = await getCollectionById(user.id, collectionId);

  if (!collection) {
    notFound();
    return null;
  }

  const booksInCollection: Book[] = await getBooksInCollection(user.id, collection.bookIds || []);
  const allUserBooks: Book[] = await getAllBooksForUser(user.id);

  return (
    <CollectionDetailClient
      collection={collection}
      booksInCollection={booksInCollection}
      allUserBooks={allUserBooks}
    />
  );
}
