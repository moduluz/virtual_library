// filepath: C:/JavaScript/library-app/lib/actions/collection.actions.ts
import { Collection } from '@/types'; // Or use: import { Collection } from '../../types'; if @/types isn't working yet

export async function removeBookFromCollectionClient(
  collectionId: string,
  bookIdToRemove: string
): Promise<Collection | null> {
  if (!collectionId || !bookIdToRemove) {
    console.error("Collection ID and Book ID to remove are required.");
    return null;
  }

  try {
    // First, get the current collection to get its bookIds
    // This step is important if the client doesn't already have the most up-to-date list of bookIds
    const currentCollectionRes = await fetch(`/api/collections/${collectionId}`);
    if (!currentCollectionRes.ok) {
      const errorData = await currentCollectionRes.json().catch(() => ({}));
      console.error("Failed to fetch current collection details for removal:", errorData.error || currentCollectionRes.statusText);
      return null;
    }
    const currentCollectionData: Collection = await currentCollectionRes.json();
    const currentBookIds = currentCollectionData.bookIds || [];

    const updatedBookIds = currentBookIds.filter(id => id !== bookIdToRemove);

    const response = await fetch(`/api/collections/${collectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookIds: updatedBookIds }), // Send only the updated bookIds
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to update collection (remove book):", errorData.error || response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Client-side error removing book from collection:", error);
    return null;
  }
}

// You can add other client-side action functions related to collections here
// For example, a function to add books to a collection might also go here.