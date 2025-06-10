import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Schema for validating PATCH request body
const collectionPatchSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional().nullable(),
  color: z
    .string()
    .startsWith("#", "Color must be a hex code")
    .length(7, "Color must be a 7-character hex code")
    .optional(),
  bookIds: z
    .array(z.string().uuid("Each book ID must be a valid UUID"))
    .optional(), // Expects an array of book UUIDs
});

// PATCH: Update a collection (name, description, color, or bookIds)
export async function PATCH(
  request: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.collectionId;
    if (!collectionId) {
      return Response.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = collectionPatchSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid input", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "No update data provided" }, { status: 400 });
    }

    // Ensure bookIds is not undefined if it's the only thing being updated to an empty array
    const payload: any = {};
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.description !== undefined)
      payload.description = updateData.description;
    if (updateData.color !== undefined) payload.color = updateData.color;
    if (updateData.bookIds !== undefined) payload.bookIds = updateData.bookIds;

    const { data: updatedCollection, error: updateError } = await supabase
      .from("collections")
      .update(payload)
      .eq("id", collectionId)
      .eq("userId", userId)
      .select()
      .single();

    if (updateError) {
      console.error("API_COLLECTION_ID_PATCH: Error updating collection:", updateError);
      if (updateError.code === "PGRST116") {
        return Response.json(
          { error: "Collection not found or user not authorized" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: "Failed to update collection", details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedCollection) {
      // Should be caught by PGRST116
      return Response.json(
        { error: "Collection not found after update attempt" },
        { status: 404 }
      );
    }

    return Response.json(updatedCollection);
  } catch (error: any) {
    console.error("API_COLLECTION_ID_PATCH: Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a collection
export async function DELETE(
  request: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collectionId = params.collectionId;
    if (!collectionId) {
      return Response.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId)
      .eq("userId", userId);

    if (error) {
      console.error("API_COLLECTION_ID_DELETE: Error deleting collection:", error);
      // Consider if the error means "not found" vs. actual delete failure
      return Response.json(
        { error: "Failed to delete collection", details: error.message },
        { status: 500 }
      );
    }

    // For DELETE, it's common to return 204 No Content on success, or 200 with a message.
    return Response.json(
      { message: "Collection deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API_COLLECTION_ID_DELETE: Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

// --- GET Function (for fetching all books) ---
// There should be ONLY ONE of these in this file.
export async function GET(request: Request) {
  console.log("API_BOOKS_GET: Received GET request for all books");
  try {
    const { userId } = await auth(); // Correctly await auth()
    console.log("API_BOOKS_GET: userId from Clerk:", userId);

    if (!userId) {
      console.warn("API_BOOKS_GET: Unauthorized access attempt - no userId.");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`API_BOOKS_GET: Fetching all books for userId: ${userId}`);

    if (!supabase) {
        console.error("API_BOOKS_GET: Supabase client is not initialized.");
        return Response.json({ error: "Server configuration error: Supabase client not available." }, { status: 500 });
    }

    // MODIFIED QUERY: Removed dateCompleted if it doesn't exist
    // Only select columns that actually exist in your 'books' table.
    // Refer to your Supabase table schema (the screenshot you provided earlier).
    const { data, error } = await supabase
      .from('books')
      .select('id, userId, title, author, isbn, coverUrl, description, genre, pageCount, publishedDate, status, rating, notes, dateAdded, pdf_url') // List all existing columns you need
      .eq('userId', userId);

    if (error) {
      console.error("Error fetching books from Supabase in API route:", error);
      // Return the actual Supabase error for better debugging
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // console.log("Data from Supabase in API route:", data); // Good for debugging
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error: any) {
    console.error("API_BOOKS_GET: Unexpected error in GET /api/books:", error);
    return Response.json({ error: "An unexpected internal server error occurred while fetching books.", details: error.message || String(error) }, { status: 500 });
  }
}

// --- POST Function (Example: for adding a new book) ---
// If you don't have a POST function, you can remove this.
// Ensure it also correctly awaits auth() if needed.

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  coverUrl: z.string().url("Invalid URL format for cover image").optional().nullable(),
  isbn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  pageCount: z.number().int().positive().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required"), // e.g., 'to-read', 'reading', 'read'
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  pdf_url: z.string().url("Invalid URL format for PDF").optional().nullable(),
});

export async function POST(request: Request) {
  console.log("API_BOOKS_POST: Received POST request to add a book");
  try {
    const { userId } = await auth(); // Correctly await auth()
    if (!userId) {
      console.warn("API_BOOKS_POST: Unauthorized attempt to add book.");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error("API_BOOKS_POST: Invalid JSON body", e);
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const parseResult = bookSchema.safeParse(body);

    if (!parseResult.success) {
      console.warn("API_BOOKS_POST: Invalid input for new book:", parseResult.error.flatten());
      return Response.json({ error: "Invalid input", details: parseResult.error.flatten() }, { status: 400 });
    }

    const bookData = parseResult.data;

    if (!supabase) {
        console.error("API_BOOKS_POST: Supabase client is not initialized.");
        return Response.json({ error: "Server configuration error: Supabase client not available." }, { status: 500 });
    }

    const { data: newBook, error: supabaseError } = await supabase
      .from("books")
      .insert([{ ...bookData, userId: userId }]) // Add userId to the book data
      .select()
      .single();

    if (supabaseError) {
      console.error("API_BOOKS_POST: Supabase error while adding book:", supabaseError);
      return Response.json({ error: "Failed to add book due to a database error.", details: supabaseError.message }, { status: 500 });
    }

    console.log("API_BOOKS_POST: Successfully added book:", newBook);
    return Response.json(newBook, { status: 201 });

  } catch (error: any) {
    console.error("API_BOOKS_POST: Unexpected error in POST /api/books:", error);
    return Response.json({ error: "An unexpected internal server error occurred while adding the book.", details: error.message || String(error) }, { status: 500 });
  }
}

