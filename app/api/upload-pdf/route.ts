import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bookData = JSON.parse(formData.get("bookData") as string);

    if (!file || !bookData) {
      return Response.json({ error: "Missing required data" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Step 1: Create book record first (without PDF URL)
    const book = await prisma.book.create({
      data: {
        userId,
        ...bookData,
      },
    });

    // Step 2: Upload PDF to UploadThing
    const uploadResponse = await utapi.uploadFiles(file);

    if (uploadResponse.error) {
      // Clean up the book record if upload fails
      await prisma.book.delete({ where: { id: book.id } });
      return Response.json({ error: uploadResponse.error.message }, { status: 500 });
    }

    const pdfUrl = uploadResponse.data.url;

    // Step 3: Update book with PDF URL
    const updatedBook = await prisma.book.update({
      where: { id: book.id },
      data: { pdfUrl },
    });

    return Response.json({
      success: true,
      book: updatedBook,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}