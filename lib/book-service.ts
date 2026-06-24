import { prisma } from "./prisma";

// Book type re-exported from Prisma for convenience
import type { Book } from "@prisma/client";
export type { Book };

// Get all books for a user
export async function getAllBooks(userId: string): Promise<Book[]> {
  try {
    return await prisma.book.findMany({
      where: { userId },
      orderBy: { dateAdded: "desc" },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

// Get a single book by ID
export async function getBookById(
  userId: string,
  bookId: string
): Promise<Book | null> {
  try {
    return await prisma.book.findFirst({
      where: { id: bookId, userId },
    });
  } catch (error) {
    console.error("getBookById error:", error);
    return null;
  }
}

// Add a new book
export async function addBook(
  userId: string,
  book: Omit<Book, "id" | "userId" | "dateAdded">
): Promise<Book> {
  return await prisma.book.create({
    data: {
      ...book,
      userId,
    },
  });
}

// Update a book
export async function updateBook(
  userId: string,
  bookId: string,
  updates: Partial<Book>
): Promise<void> {
  // Clean up the updates object
  const cleanedUpdates = { ...updates };

  // Handle rating validation
  if (cleanedUpdates.rating !== undefined) {
    const rating = Number(cleanedUpdates.rating);
    if (isNaN(rating)) {
      cleanedUpdates.rating = null;
    } else if (rating < 0 || rating > 5) {
      throw new Error("Rating must be between 0 and 5");
    } else {
      cleanedUpdates.rating = rating;
    }
  }

  // Remove fields that shouldn't be updated directly
  delete (cleanedUpdates as any).id;
  delete (cleanedUpdates as any).userId;

  await prisma.book.updateMany({
    where: { id: bookId, userId },
    data: cleanedUpdates,
  });
}

// Delete a book
export async function deleteBook(
  userId: string,
  bookId: string
): Promise<void> {
  await prisma.book.deleteMany({
    where: { id: bookId, userId },
  });
}

// Get books in a specific collection
export async function getBooksInCollection(
  userId: string,
  bookIds: string[]
): Promise<Book[]> {
  if (!bookIds || bookIds.length === 0) {
    return [];
  }

  try {
    return await prisma.book.findMany({
      where: {
        userId,
        id: { in: bookIds },
      },
    });
  } catch (error) {
    console.error("Error fetching books in collection:", error);
    return [];
  }
}

// Get all books for a user (alias)
export async function getAllBooksForUser(userId: string): Promise<Book[]> {
  if (!userId) {
    console.warn("getAllBooksForUser: userId is required.");
    return [];
  }
  try {
    return await prisma.book.findMany({
      where: { userId },
    });
  } catch (err) {
    console.error("Unexpected error in getAllBooksForUser:", err);
    return [];
  }
}
