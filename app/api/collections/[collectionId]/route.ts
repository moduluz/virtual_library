import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  console.log(`API_COLLECTION_ID_GET: Received GET request for collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth();
    const { collectionId } = params;

    if (!userId) {
      console.warn("API_COLLECTION_ID_GET: Unauthorized access attempt - no userId.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      console.warn("API_COLLECTION_ID_GET: Collection ID is missing in params.");
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    if (!supabase) {
      console.error("API_COLLECTION_ID_GET: Supabase client is not initialized.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log(`API_COLLECTION_ID_GET: Fetching collection ${collectionId} for userId ${userId}`);
    const { data: collection, error: supabaseError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .eq("userId", userId)
      .single();

    if (supabaseError) {
      console.error(`API_COLLECTION_ID_GET: Supabase error fetching collection ${collectionId}:`, supabaseError);
      if (supabaseError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Database error fetching collection", details: supabaseError.message }, { status: 500 });
    }

    if (!collection) {
      console.warn(`API_COLLECTION_ID_GET: Collection ${collectionId} not found for userId ${userId}.`);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    console.log(`API_COLLECTION_ID_GET: Successfully fetched collection ${collectionId}.`);
    return NextResponse.json(collection);

  } catch (error: any) {
    console.error(`API_COLLECTION_ID_GET: Unexpected error for collectionId ${params.collectionId}:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred.", details: error.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  console.log(`API_COLLECTION_ID_PATCH: Received PATCH request for collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth();
    const { collectionId } = params;
    const body = await request.json();

    if (!userId) {
      console.warn("API_COLLECTION_ID_PATCH: Unauthorized.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!collectionId) {
      console.warn("API_COLLECTION_ID_PATCH: Collection ID missing.");
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }
    if (!supabase) {
      console.error("API_COLLECTION_ID_PATCH: Supabase client not initialized.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Ensure body contains valid fields to update, e.g., name, description, bookIds, color
    const { name, description, bookIds, color } = body;
    const updateData: { name?: string, description?: string, bookIds?: string[], color?: string, updatedAt: string } = {
        updatedAt: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (bookIds !== undefined) updateData.bookIds = bookIds;
    if (color !== undefined) updateData.color = color;


    if (Object.keys(updateData).length === 1 && 'updatedAt' in updateData) {
        console.warn("API_COLLECTION_ID_PATCH: No fields to update provided.");
        return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
    }


    console.log(`API_COLLECTION_ID_PATCH: Updating collection ${collectionId} for userId ${userId} with data:`, updateData);
    const { data: updatedCollection, error: supabaseError } = await supabase
      .from("collections")
      .update(updateData)
      .eq("id", collectionId)
      .eq("userId", userId)
      .select()
      .single();

    if (supabaseError) {
      console.error(`API_COLLECTION_ID_PATCH: Supabase error updating collection ${collectionId}:`, supabaseError);
      if (supabaseError.code === 'PGRST116') { // Not found or not owned by user
        return NextResponse.json({ error: "Collection not found or update failed" }, { status: 404 });
      }
      return NextResponse.json({ error: "Database error updating collection.", details: supabaseError.message }, { status: 500 });
    }
    
    if (!updatedCollection) {
        console.warn(`API_COLLECTION_ID_PATCH: Collection ${collectionId} not found after update attempt.`);
        return NextResponse.json({ error: "Collection not found or update failed" }, { status: 404 });
    }

    console.log(`API_COLLECTION_ID_PATCH: Successfully updated collection ${collectionId}.`);
    revalidatePath(`/collections`);
    revalidatePath(`/collections/${collectionId}`);
    return NextResponse.json(updatedCollection);

  } catch (error: any) {
    console.error(`API_COLLECTION_ID_PATCH: Unexpected error for collectionId ${params.collectionId}:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred.", details: error.message || String(error) }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  console.log(`API_COLLECTION_ID_DELETE: Received DELETE request for collectionId: ${params.collectionId}`);
  try {
    const { userId } = await auth();
    const { collectionId } = params;

    if (!userId) {
      console.warn("API_COLLECTION_ID_DELETE: Unauthorized.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      console.warn("API_COLLECTION_ID_DELETE: Collection ID missing.");
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }
    
    if (!supabase) {
      console.error("API_COLLECTION_ID_DELETE: Supabase client not initialized.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log(`API_COLLECTION_ID_DELETE: Deleting collection ${collectionId} for userId ${userId}`);
    const { error: supabaseError, count } = await supabase
      .from("collections")
      .delete({ count: 'exact' }) // Get the count of deleted rows
      .eq("id", collectionId)
      .eq("userId", userId); // Crucial: only delete if the user owns it

    if (supabaseError) {
      console.error(`API_COLLECTION_ID_DELETE: Supabase error deleting collection ${collectionId}:`, supabaseError);
      return NextResponse.json({ error: "Database error deleting collection.", details: supabaseError.message }, { status: 500 });
    }

    if (count === 0) {
      // This means no row was deleted, either because it didn't exist or didn't belong to the user.
      console.warn(`API_COLLECTION_ID_DELETE: Collection ${collectionId} not found for userId ${userId} or already deleted.`);
      return NextResponse.json({ error: "Collection not found or you do not have permission to delete it." }, { status: 404 });
    }
    
    console.log(`API_COLLECTION_ID_DELETE: Successfully deleted collection ${collectionId}. Count: ${count}`);
    
    // Revalidate paths that show collections
    revalidatePath('/collections'); // For the list of collections
    // If you have a dynamic path for user-specific collections, revalidate that too.
    // e.g., revalidatePath(`/user/${userId}/collections`);

    return NextResponse.json({ message: "Collection deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error(`API_COLLECTION_ID_DELETE: Unexpected error for collectionId ${params.collectionId}:`, error);
    return NextResponse.json({ error: "An unexpected internal server error occurred.", details: error.message || String(error) }, { status: 500 });
  }
}