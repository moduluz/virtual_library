import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getReadingStats(userId: string) {
  // Check for existing reading goal
  let currentReadingGoal = 12;
  const existingStats = await prisma.readingStats.findUnique({
    where: { userId },
  });

  if (existingStats) {
    currentReadingGoal = existingStats.readingGoal || 12;
  }

  // Get book counts by status
  const [booksRead, booksInProgress, booksWantToRead] = await Promise.all([
    prisma.book.count({ where: { userId, status: "completed" } }),
    prisma.book.count({ where: { userId, status: "reading" } }),
    prisma.book.count({ where: { userId, status: "want-to-read" } }),
  ]);

  // Calculate total pages from daily logs
  const pagesResult = await prisma.dailyReadingLog.aggregate({
    where: { userId },
    _sum: { pagesReadOnDate: true },
  });
  const totalPagesFromLogs = pagesResult._sum.pagesReadOnDate || 0;

  const newStats = {
    userId,
    booksRead,
    pagesRead: totalPagesFromLogs,
    booksInProgress,
    booksWantToRead,
    readingGoal: currentReadingGoal,
  };

  // Upsert stats
  await prisma.readingStats.upsert({
    where: { userId },
    create: newStats,
    update: newStats,
  });

  return newStats;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getReadingStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Stats API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch stats", details: errorMessage },
      { status: 500 }
    );
  }
}