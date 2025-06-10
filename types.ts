export interface Book {
  id: string; // Typically a UUID or database ID
  title: string;
  author: string;
  coverUrl?: string | null; // Optional, can be null if no cover
  isbn?: string | null;
  description?: string | null;
  genre?: string | null; // Ensure genre is defined, and matches the case from DB
  pageCount?: number | null;
  publishedDate?: string | null; // Or Date type, depending on how you handle it
  status?: 'to-read' | 'reading' | 'read' | string; // Example statuses, or just string
  rating?: number | null; // e.g., 0-5
  notes?: string | null;
  dateAdded?: string | Date; // When the book was added to the user's library
  userId: string; // To associate the book with a user
  pdf_url?: string | null; // If you store PDF URLs
  // Add any other properties relevant to a book in your library
}

export interface Collection {
  id: string; // Typically a UUID or database ID
  name: string;
  description?: string | null;
  color?: string | null; // For UI theming of the collection
  bookIds?: string[] | null; // An array of Book IDs belonging to this collection
  userId: string; // To associate the collection with a user
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Add any other properties relevant to a collection
}

// You can add other shared types here as your project grows.
// For example, if you have user profiles:
// export interface UserProfile {
//   id: string;
//   username: string;
//   email: string;
//   // ...
// }