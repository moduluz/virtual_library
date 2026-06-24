import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Helper: extract UploadThing file key from URL
function getKeyFromUrl(url: string): string | null {
  const match = url.match(/\/f\/([^/?]+)/);
  return match ? match[1] : null;
}

// GET: Fetch a single book by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = await params;

    if (!bookId) {
      return Response.json({ error: "Book ID is required" }, { status: 400 });
    }

    const book = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!book) {
      return Response.json(
        { error: "Book not found or you don't have access" },
        { status: 404 }
      );
    }

    return Response.json(book);
  } catch (err: any) {
    console.error("API GET Error:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update a book
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = await params;
    const body = await request.json();

    if (!bookId) {
      return Response.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Verify book exists and belongs to user
    const existingBook = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existingBook) {
      return Response.json(
        { error: "Book not found or you don't have access to update it" },
        { status: 404 }
      );
    }

    // Exclude userId and id from being updated
    const { userId: _bodyUserId, id: _bodyId, ...updateData } = body;

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
    });

    return Response.json(updatedBook);
  } catch (err: any) {
    console.error("API PUT Error:", err.message);
    if (err instanceof SyntaxError) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a book
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = await params;

    if (!bookId) {
      return Response.json({ error: "Book ID is required" }, { status: 400 });
    }

    // Find the book first to check for PDF
    const existingBook = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existingBook) {
      return Response.json(
        { error: "Book not found or you don't have access to delete it" },
        { status: 404 }
      );
    }

    // Delete PDF from UploadThing if it exists
    if (existingBook.pdfUrl) {
      try {
        const key = getKeyFromUrl(existingBook.pdfUrl);
        if (key) {
          await utapi.deleteFiles(key);
        }
      } catch (storageError) {
        console.error("Error deleting PDF from UploadThing:", storageError);
        // Continue with book deletion even if PDF cleanup fails
      }
    }

    await prisma.book.delete({
      where: { id: bookId },
    });

    return Response.json(
      { message: "Book deleted successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("API DELETE Error:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
