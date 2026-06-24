import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, pagesRead, dateRead } = body;

    if (!bookId || typeof pagesRead !== "number" || !dateRead) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = await prisma.dailyReadingLog.create({
      data: {
        userId,
        bookId,
        pagesReadOnDate: pagesRead,
        readDate: new Date(dateRead),
      },
    });

    return NextResponse.json(
      { message: "Reading progress logged successfully", data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in log-daily-reading:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}