import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { collectionId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { books: { select: { id: true } } },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...collection,
      bookIds: collection.books.map((b) => b.id),
    });
  } catch (error: any) {
    console.error("API_COLLECTION_ID_GET: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { collectionId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const { name, description, bookIds, color } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (bookIds !== undefined) {
      updateData.books = {
        set: bookIds.map((id: string) => ({ id })),
      };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update provided" }, { status: 400 });
    }

    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId, userId },
      data: updateData,
      include: { books: { select: { id: true } } },
    });

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);

    return NextResponse.json({
      ...updatedCollection,
      bookIds: updatedCollection.books.map((b) => b.id),
    });
  } catch (error: any) {
    console.error("API_COLLECTION_ID_PATCH: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { collectionId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const result = await prisma.collection.deleteMany({
      where: { id: collectionId, userId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Collection not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    revalidatePath("/collections");
    return NextResponse.json({ message: "Collection deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("API_COLLECTION_ID_DELETE: Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}