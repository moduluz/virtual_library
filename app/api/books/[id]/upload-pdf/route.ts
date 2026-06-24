import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// Helper: extract UploadThing file key from URL
function getKeyFromUrl(url: string): string | null {
  // UploadThing URLs look like: https://utfs.io/f/<fileKey>
  const match = url.match(/\/f\/([^/?]+)/);
  return match ? match[1] : null;
}

// POST: Upload or replace PDF for an existing book
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookId } = await params;

    // Verify book belongs to this user
    const existingBook = await prisma.book.findFirst({
      where: { id: bookId, userId },
    });

    if (!existingBook) {
      return Response.json({ error: "Book not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Delete existing PDF from UploadThing if present
    if (existingBook.pdfUrl) {
      try {
        const key = getKeyFromUrl(existingBook.pdfUrl);
        if (key) {
          await utapi.deleteFiles(key);
        }
      } catch (e) {
        console.error("Error deleting old PDF:", e);
      }
    }

    // Upload new PDF
    const uploadResponse = await utapi.uploadFiles(file);

    if (uploadResponse.error) {
      return Response.json({ error: uploadResponse.error.message }, { status: 500 });
    }

    const pdfUrl = uploadResponse.data.url;

    // Update book record
    await prisma.book.update({
      where: { id: bookId },
      data: { pdfUrl },
    });

    return Response.json({ pdfUrl }, { status: 200 });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
