import { getBooksInCollection, getAllBooksForUser } from "@/lib/book-service";
import { getCollectionById } from "@/lib/collection-service";
import CollectionDetailClient from "@/components/collections/CollectionDetailClient";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";

interface CollectionDetailPageProps {
  params: { collectionId: string };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const resolvedParams = await params;
  const { collectionId } = resolvedParams;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
    return null;
  }

  const collection = await getCollectionById(session.user.id, collectionId);

  if (!collection) {
    notFound();
    return null;
  }

  const booksInCollection = await getBooksInCollection(session.user.id, collection.bookIds || []);
  const allUserBooks = await getAllBooksForUser(session.user.id);

  return (
    <CollectionDetailClient
      collection={collection}
      booksInCollection={booksInCollection}
      allUserBooks={allUserBooks}
    />
  );
}
