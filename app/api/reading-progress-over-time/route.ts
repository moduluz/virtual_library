import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase"; // Assuming your Supabase client is here

export async function GET(request: Request) {
  console.log("/api/reading-progress-over-time endpoint hit"); // <--- ADD THIS
  try {
    const user = await currentUser();
    console.log("User in API:", user?.id); // <--- ADD THIS

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch daily reading logs for the user, sum pages_read_on_date by read_date
    // We'll fetch the last 30-60 days for example, you can adjust the range
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("daily_reading_logs")
      .select("read_date, pages_read_on_date")
      .eq("user_id", user.id)
      .gte("read_date", thirtyDaysAgo.toISOString().split('T')[0]) // Filter for dates >= thirtyDaysAgo
      .order("read_date", { ascending: true });

    console.log("Supabase data:", data); // <--- ADD THIS
    console.log("Supabase error:", error); // <--- ADD THIS

    if (error) {
      console.error("Error fetching reading progress:", error);
      return NextResponse.json(
        { error: "Failed to fetch reading progress" },
        { status: 500 }
      );
    }

    // Aggregate data: sum pages_read_on_date for each unique read_date
    const aggregatedData: { [date: string]: number } = {};
    if (data) {
      for (const log of data) {
        const dateStr = new Date(log.read_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        aggregatedData[dateStr] = (aggregatedData[dateStr] || 0) + (log.pages_read_on_date || 0);
      }
    }
    
    const chartData = Object.entries(aggregatedData).map(([date, pagesRead]) => ({
        date,
        pagesRead,
    }));

    // Ensure dates are sorted if not already, though the query does order by read_date
    // For simplicity, we'll assume the order from the map conversion is sufficient for now
    // or that the client-side chart can handle unsorted date points if necessary.
    // A more robust solution might re-sort here based on the original date objects.

    console.log("Chart data being sent:", chartData); // <--- ADD THIS
    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error in reading-progress-over-time GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}