import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.dailyReadingLog.findMany({
      where: {
        userId,
        readDate: { gte: thirtyDaysAgo },
      },
      orderBy: { readDate: "asc" },
    });

    // Aggregate data by date
    const aggregatedData: { [date: string]: number } = {};
    for (const log of logs) {
      const dateStr = new Date(log.readDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      aggregatedData[dateStr] = (aggregatedData[dateStr] || 0) + (log.pagesReadOnDate || 0);
    }

    const chartData = Object.entries(aggregatedData).map(([date, pagesRead]) => ({
      date,
      pagesRead,
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error in reading-progress-over-time:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}