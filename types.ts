// Shared application types — aligned with Prisma schema

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  genre?: string | null;
  pageCount?: number | null;
  publishedDate?: string | null;
  status: "want-to-read" | "reading" | "completed" | string;
  rating?: number | null;
  notes?: string | null;
  dateAdded: string | Date;
  pdfUrl?: string | null;   // Prisma camelCase (maps to pdf_url column)
  // Legacy alias kept for compatibility
  pdf_url?: string | null;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  bookIds?: string[]; // Computed from the many-to-many relation
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ReadingStats {
  userId: string;
  booksRead: number;
  pagesRead: number;
  booksInProgress: number;
  booksWantToRead: number;
  readingGoal: number;
}

export interface DailyReadingLog {
  id: string;
  userId: string;
  bookId: string;
  pagesReadOnDate: number;
  readDate: string | Date;
}