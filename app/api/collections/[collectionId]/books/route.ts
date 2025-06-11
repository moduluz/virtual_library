import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Ensure auth is imported
import { supabase } from '@/lib/supabase'; // Ensure supabase is imported
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: { collectionId: string } }
) {
  const params = await paramsPromise; // Await the params object
  console.log(`API_COLLECTION_BOOKS_GET: Received GET request for books in collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth();
    const { collectionId } = params; // Now params is resolved

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }
    if (!supabase) {
      console.error('API_COLLECTION_BOOKS_GET: Supabase client is not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // First, get the collection to verify ownership and get bookIds
    const { data: collectionData, error: collectionError } = await supabase
      .from("collections")
      .select("bookIds")
      .eq("id", collectionId)
      .eq("userId", userId)
      .single();

    if (collectionError) {
      console.error(`API_COLLECTION_BOOKS_GET: Error fetching collection ${collectionId}:`, collectionError);
      if (collectionError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch collection details', details: collectionError.message }, { status: 500 });
    }

    if (!collectionData) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
    }

    const bookIds = collectionData.bookIds;
    if (!bookIds || bookIds.length === 0) {
      console.log(`API_COLLECTION_BOOKS_GET: No books in collection ${collectionId}.`);
      return NextResponse.json([], { status: 200 }); // Return empty array if no book IDs
    }

    // Fetch books whose IDs are in the bookIds array
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("*")
      .in("id", bookIds)
      .eq("userId", userId); // Ensure books also belong to the user for an extra layer, though bookIds from collection should suffice

    if (booksError) {
      console.error(`API_COLLECTION_BOOKS_GET: Error fetching books for collection ${collectionId}:`, booksError);
      return NextResponse.json({ error: 'Failed to fetch books for collection', details: booksError.message }, { status: 500 });
    }

    console.log(`API_COLLECTION_BOOKS_GET: Successfully fetched books for collection ${collectionId}.`);
    return NextResponse.json(books || []);

  } catch (error: any) {
    console.error(`API_COLLECTION_BOOKS_GET: Unexpected error for collectionId ${params.collectionId}:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred", details: error.message || String(error) }, { status: 500 });
  }
}


export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: { collectionId: string } }
) {
  const params = await paramsPromise; // Await the params object
  console.log(`API_COLLECTION_BOOKS_POST: Received POST request for collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth();
    const { collectionId } = params; // Now params is resolved
    const body = await request.json();
    const { bookIdsToAdd }: { bookIdsToAdd: string[] } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID is required' }, { status: 400 });
    }

    if (!bookIdsToAdd || !Array.isArray(bookIdsToAdd) || bookIdsToAdd.some(id => typeof id !== 'string')) {
      return NextResponse.json({ error: 'bookIdsToAdd must be an array of strings' }, { status: 400 });
    }
    if (bookIdsToAdd.length === 0) {
        return NextResponse.json({ error: 'bookIdsToAdd cannot be empty' }, { status: 400 });
    }
    
    if (!supabase) {
      console.error('API_COLLECTION_BOOKS_POST: Supabase client is not initialized');
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
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
      console.error(`API_COLLECTION_BOOKS_POST: Error fetching collection ${collectionId}:`, fetchError);
      if (fetchError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch collection', details: fetchError.message }, { status: 500 });
    }

    if (!currentCollection) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
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
      .eq("userId", userId)
      .select()
      .single();

    if (updateError) {
      console.error(`API_COLLECTION_BOOKS_POST: Error updating collection ${collectionId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update collection', details: updateError.message }, { status: 500 });
    }
    
    console.log(`API_COLLECTION_BOOKS_POST: Successfully added books to collection ${collectionId}.`);
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath('/collections');
    return NextResponse.json(updatedCollection, { status: 200 });

  } catch (error: any) {
    console.error(`API_COLLECTION_BOOKS_POST: Unexpected error for collectionId ${params.collectionId}:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred", details: error.message || String(error) }, { status: 500 });
  }
}
