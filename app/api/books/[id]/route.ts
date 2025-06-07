import { supabase } from '@/lib/supabase'; // Or your admin client if needed for specific operations
import { auth, currentUser } from '@clerk/nextjs/server'; // For authentication

// Example for GET
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth(); // Get the authenticated user's ID
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = params; // The ID of the book from the URL

    if (!bookId) {
      return Response.json({ error: "Book ID is required" }, { status: 400 });
    }

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('userId', userId) // Ensure the user owns the book (example RLS check)
      .single();

    if (error) {
      console.error("Supabase GET error:", error.message);
      if (error.code === 'PGRST116') { // Not found
         return Response.json({ error: "Book not found or you don't have access" }, { status: 404 });
      }
      return Response.json({ error: "Failed to fetch book" }, { status: 500 });
    }

    if (!book) {
       return Response.json({ error: "Book not found or you don't have access" }, { status: 404 });
    }

    return Response.json(book);
  } catch (err: any) {
    console.error("API GET Error:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Example for PUT (Update)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = params;
    const body = await request.json(); // Get the update data from the request body

    if (!bookId) {
      return Response.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Optional: Fetch the book first to ensure it exists and user owns it
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('id, userId')
      .eq('id', bookId)
      .eq('userId', userId)
      .single();

    if (fetchError || !existingBook) {
      return Response.json({ error: "Book not found or you don't have access to update it" }, { status: 404 });
    }
    
    // Exclude userId and id from being updated directly from body if they exist
    const { userId: bodyUserId, id: bodyId, ...updateData } = body;

    const { data: updatedBook, error: updateError } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .eq('userId', userId) // Ensure update only happens if user owns it
      .select()
      .single();

    if (updateError) {
      console.error("Supabase PUT error:", updateError.message);
      return Response.json({ error: "Failed to update book" }, { status: 500 });
    }
    
    if (!updatedBook) {
        return Response.json({ error: "Failed to update book or book not found after update" }, { status: 404 });
    }

    return Response.json(updatedBook);
  } catch (err: any) {
    console.error("API PUT Error:", err.message);
    if (err instanceof SyntaxError) { // JSON parsing error
        return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Example for DELETE
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: bookId } = params;

        if (!bookId) {
            return Response.json({ error: "Book ID is required" }, { status: 400 });
        }

        // Optional: Check if book exists and user owns it before deleting
        const { data: existingBook, error: fetchError } = await supabase
            .from('books')
            .select('id, userId, pdf_url') // Select pdf_url if you need to delete it from storage
            .eq('id', bookId)
            .eq('userId', userId)
            .single();

        if (fetchError || !existingBook) {
            return Response.json({ error: "Book not found or you don't have access to delete it" }, { status: 404 });
        }

        // If there's an associated PDF, delete it from storage first
        if (existingBook.pdf_url) {
            const pdfFileName = existingBook.pdf_url.substring(existingBook.pdf_url.lastIndexOf('/') + 1);
            // IMPORTANT: For storage operations that need user context (like deleting user's own file based on RLS)
            // you CANNOT use the admin Supabase client here if RLS is to be respected.
            // This is a complex area. If your storage RLS allows authenticated users to delete their own files,
            // this API route would need to be called with the user's JWT.
            // For simplicity, if using admin client for DB delete, you might also use admin for storage delete,
            // but be mindful of security implications.
            // For now, let's assume the DB delete RLS is sufficient or you handle storage deletion elsewhere.
            // const { error: storageError } = await supabase.storage.from('books-pdf').remove([pdfFileName]);
            // if (storageError) {
            //    console.error("Error deleting PDF from storage:", storageError);
            //    // Decide if you want to stop the DB deletion or just log
            // }
        }


        const { error: deleteError } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId)
            .eq('userId', userId); // Ensure delete only happens if user owns it

        if (deleteError) {
            console.error("Supabase DELETE error:", deleteError.message);
            return Response.json({ error: "Failed to delete book" }, { status: 500 });
        }

        return Response.json({ message: "Book deleted successfully" }, { status: 200 }); // Or 204 No Content
    } catch (err: any) {
        console.error("API DELETE Error:", err.message);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
