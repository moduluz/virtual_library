import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addCollection } from "@/lib/collection-service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const collection = await addCollection(userId, data);

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error adding collection:", error);
    return NextResponse.json(
      { error: "Failed to add collection" },
      { status: 500 }
    );
  }
}