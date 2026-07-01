import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCollection } from "@/lib/collection-service";
import { z } from "zod";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = collectionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const collection = await addCollection(userId, parseResult.data);
    return NextResponse.json(collection);
  } catch (error: any) {
    console.error("Error adding collection:", error);
    return NextResponse.json(
      { error: "Failed to add collection" },
      { status: 500 }
    );
  }
}