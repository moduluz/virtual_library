import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  coverUrl: z.string().url("Invalid URL format for cover image").optional().nullable(),
  isbn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  pageCount: z.number().int().positive().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
  status: z.string().min(1, "Status is required"),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  pdf_url: z.string().url("Invalid URL format for PDF").optional().nullable(),
});

// GET: Fetch all books for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await prisma.book.findMany({
      where: { userId },
      orderBy: { dateAdded: "desc" },
    });

    return Response.json(data, { status: 200 });
  } catch (error: any) {
    console.error("API_BOOKS_GET: Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Add a new book
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = bookSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid input", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const bookData = parseResult.data;

    const newBook = await prisma.book.create({
      data: {
        userId,
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl || null,
        isbn: bookData.isbn || null,
        description: bookData.description || null,
        genre: bookData.genre || null,
        pageCount: bookData.pageCount || null,
        publishedDate: bookData.publishedDate || null,
        status: bookData.status,
        rating: bookData.rating || null,
        notes: bookData.notes || null,
        pdfUrl: bookData.pdf_url || null,
      },
    });

    return Response.json(newBook, { status: 201 });
  } catch (error: any) {
    console.error("API_BOOKS_POST: Unexpected error:", error);
    return Response.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}
