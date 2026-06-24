import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: { collectionId: string } }
) {
  const params = await paramsPromise;
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { collectionId } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    // Get collection with books
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { books: true },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(collection.books);
  } catch (error: any) {
    console.error("API_COLLECTION_BOOKS_GET: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: { collectionId: string } }
) {
  const params = await paramsPromise;
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { collectionId } = params;
    const body = await request.json();
    const { bookIdsToAdd }: { bookIdsToAdd: string[] } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    if (
      !bookIdsToAdd ||
      !Array.isArray(bookIdsToAdd) ||
      bookIdsToAdd.length === 0
    ) {
      return NextResponse.json(
        { error: "bookIdsToAdd must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    // Verify collection exists and belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found or access denied" },
        { status: 404 }
      );
    }

    // Connect books to collection
    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        books: {
          connect: bookIdsToAdd.map((id) => ({ id })),
        },
      },
      include: { books: { select: { id: true } } },
    });

    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");

    return NextResponse.json(
      {
        ...updatedCollection,
        bookIds: updatedCollection.books.map((b) => b.id),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API_COLLECTION_BOOKS_POST: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}
