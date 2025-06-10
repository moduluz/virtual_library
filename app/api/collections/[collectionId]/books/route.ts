import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  console.log(`API_COLLECTION_BOOKS_GET: Received GET request for books in collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth(); // Use await here
    const { collectionId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // First, get the collection to verify ownership and get bookIds
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("bookIds")
      .eq("id", collectionId)
      .eq("userId", userId)
      .single();

    if (collectionError || !collectionData) {
      console.error("API_COLLECTION_BOOKS_GET: Error fetching collection or collection not found/not owned:", collectionError);
      return NextResponse.json({ error: "Collection not found or access denied" }, { status: 404 });
    }

    const bookIds = collectionData.bookIds;
    if (!bookIds || bookIds.length === 0) {
      return NextResponse.json([]); // Return empty array if no book IDs
    }

    // Fetch books whose IDs are in the bookIds array
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("*") 
      .in("id", bookIds)
      .eq("userId", userId); 

    if (booksError) {
      console.error("API_COLLECTION_BOOKS_GET: Supabase error fetching books:", booksError);
      return NextResponse.json({ error: "Failed to fetch books for collection" }, { status: 500 });
    }

    return NextResponse.json(books || []);

  } catch (error: any) {
    console.error("API_COLLECTION_BOOKS_GET: Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected internal server error occurred" }, { status: 500 });
  }
}


export async function POST(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  console.log(`API_COLLECTION_BOOKS_POST: Received POST request for collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth(); // Use await here
    const { collectionId } = params;
    const body = await request.json();
    const { bookIdsToAdd }: { bookIdsToAdd: string[] } = body;

    if (!userId) {
      console.warn("API_COLLECTION_BOOKS_POST: Unauthorized.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      console.warn("API_COLLECTION_BOOKS_POST: Collection ID missing.");
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    if (!bookIdsToAdd || !Array.isArray(bookIdsToAdd) || bookIdsToAdd.length === 0) {
      console.warn("API_COLLECTION_BOOKS_POST: bookIdsToAdd array is required and cannot be empty.");
      return NextResponse.json({ error: "bookIdsToAdd array is required and cannot be empty." }, { status: 400 });
    }
    
    if (!supabase) {
      console.error("API_COLLECTION_BOOKS_POST: Supabase client not initialized.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. Fetch the current collection to get existing bookIds and ensure user ownership
    console.log(`API_COLLECTION_BOOKS_POST: Fetching current collection ${collectionId} for userId ${userId}`);
    const { data: currentCollection, error: fetchError } = await supabase
      .from("collections")
      .select("bookIds")
      .eq("id", collectionId)
      .eq("userId", userId)
      .single();

    if (fetchError) {
      console.error(`API_COLLECTION_BOOKS_POST: Supabase error fetching collection ${collectionId}:`, fetchError);
      return NextResponse.json({ error: "Database error fetching collection.", details: fetchError.message }, { status: 500 });
    }

    if (!currentCollection) {
      console.warn(`API_COLLECTION_BOOKS_POST: Collection ${collectionId} not found for userId ${userId}.`);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // 2. Combine existing bookIds with new bookIds, ensuring no duplicates
    const existingBookIds = currentCollection.bookIds || [];
    const updatedBookIds = Array.from(new Set([...existingBookIds, ...bookIdsToAdd]));

    // 3. Update the collection with the new list of bookIds
    console.log(`API_COLLECTION_BOOKS_POST: Updating collection ${collectionId} with new bookIds:`, updatedBookIds);
    const { data: updatedCollection, error: updateError } = await supabase
      .from("collections")
      .update({ bookIds: updatedBookIds, updatedAt: new Date().toISOString() })
      .eq("id", collectionId)
      .eq("userId", userId) // Redundant check if RLS is set up, but good for safety
      .select()
      .single();

    if (updateError) {
      console.error(`API_COLLECTION_BOOKS_POST: Supabase error updating collection ${collectionId}:`, updateError);
      return NextResponse.json({ error: "Database error updating collection.", details: updateError.message }, { status: 500 });
    }
    
    if (!updatedCollection) {
        // This case should ideally not be hit if the fetch before worked and update didn't error,
        // but it's a safeguard.
        console.warn(`API_COLLECTION_BOOKS_POST: Collection ${collectionId} not found after update attempt.`);
        return NextResponse.json({ error: "Collection not found or update failed" }, { status: 404 });
    }

    console.log(`API_COLLECTION_BOOKS_POST: Successfully added books to collection ${collectionId}.`);
    return NextResponse.json(updatedCollection);

  } catch (error: any) {
    console.error(`API_COLLECTION_BOOKS_POST: Unexpected error in POST /api/collections/${params.collectionId}/books:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred.", details: error.message || String(error) }, { status: 500 });
  }
}