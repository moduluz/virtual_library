import { prisma } from "./prisma";

import type { Collection } from "@prisma/client";
export type { Collection };

// Get all collections for a user
export async function getCollections(userId: string): Promise<(Collection & { bookIds: string[] })[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: { books: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return collections.map((c) => ({
    ...c,
    bookIds: c.books.map((b) => b.id),
  }));
}

// Get a single collection by ID
export async function getCollection(
  userId: string,
  collectionId: string
): Promise<(Collection & { bookIds: string[] }) | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: { books: { select: { id: true } } },
  });

  if (!collection) return null;

  return {
    ...collection,
    bookIds: collection.books.map((b) => b.id),
  };
}

// Alias for getCollection
export async function getCollectionById(
  userId: string,
  collectionId: string
) {
  return getCollection(userId, collectionId);
}

// Add a new collection
export async function addCollection(
  userId: string,
  collection: { name: string; description?: string; color?: string }
): Promise<Collection | null> {
  try {
    return await prisma.collection.create({
      data: {
        userId,
        name: collection.name,
        description: collection.description || null,
        color: collection.color || null,
      },
    });
  } catch (error) {
    console.error("Error adding collection:", error);
    return null;
  }
}

// Update a collection
export async function updateCollection(
  userId: string,
  collectionId: string,
  updates: { name?: string; description?: string; color?: string; bookIds?: string[] }
): Promise<(Collection & { bookIds: string[] }) | null> {
  try {
    const { bookIds, ...data } = updates;

    // If bookIds are provided, update the many-to-many relation
    const updateData: any = { ...data };
    if (bookIds !== undefined) {
      updateData.books = {
        set: bookIds.map((id) => ({ id })),
      };
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId, userId },
      data: updateData,
      include: { books: { select: { id: true } } },
    });

    return {
      ...updated,
      bookIds: updated.books.map((b) => b.id),
    };
  } catch (error) {
    console.error("Error updating collection:", error);
    return null;
  }
}

// Delete a collection
export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<boolean> {
  try {
    await prisma.collection.deleteMany({
      where: { id: collectionId, userId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting collection:", error);
    return false;
  }
}

// Add book to collection
export async function addBookToCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<(Collection & { bookIds: string[] }) | null> {
  try {
    const updated = await prisma.collection.update({
      where: { id: collectionId, userId },
      data: {
        books: {
          connect: { id: bookId },
        },
      },
      include: { books: { select: { id: true } } },
    });
    return {
      ...updated,
      bookIds: updated.books.map((b) => b.id),
    };
  } catch (error) {
    console.error("Error adding book to collection:", error);
    return null;
  }
}

// Remove book from collection
export async function removeBookFromCollection(
  userId: string,
  collectionId: string,
  bookId: string
): Promise<(Collection & { bookIds: string[] }) | null> {
  try {
    const updated = await prisma.collection.update({
      where: { id: collectionId, userId },
      data: {
        books: {
          disconnect: { id: bookId },
        },
      },
      include: { books: { select: { id: true } } },
    });
    return {
      ...updated,
      bookIds: updated.books.map((b) => b.id),
    };
  } catch (error) {
    console.error("Error removing book from collection:", error);
    return null;
  }
}
