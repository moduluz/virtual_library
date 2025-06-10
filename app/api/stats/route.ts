import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabase, type Book, type ReadingStats } from "@/lib/supabase" // Assuming ReadingStats type is defined

export const dynamic = 'force-dynamic'; // Ensures the route is not cached by Next.js

async function getReadingStats(userId: string): Promise<ReadingStats> {
  console.log(`[Stats API] getReadingStats called for userId: ${userId}`);

  // Attempt to fetch existing readingGoal to preserve it if user-configurable
  let currentReadingGoal = 12; // Default reading goal
  const { data: existingStatForGoal, error: existingStatGoalError } = await supabase
    .from('reading_stats')
    .select('readingGoal')
    .eq('userId', userId)
    .single();

  if (existingStatForGoal && !existingStatGoalError) {
    currentReadingGoal = existingStatForGoal.readingGoal || 12;
    console.log(`[Stats API] Found existing readingGoal: ${currentReadingGoal}`);
  } else if (existingStatGoalError && existingStatGoalError.code !== 'PGRST116') { // PGRST116: 0 rows
    console.warn(`[Stats API] Error fetching existing readingGoal:`, existingStatGoalError.message);
  } else {
    console.log(`[Stats API] No existing readingGoal found in reading_stats for user ${userId}, using default: ${currentReadingGoal}`);
  }
  
  // Fetch books for BooksRead, BooksInProgress, BooksWantToRead
  const { data: booksData, error: booksError } = await supabase
    .from('books')
    .select('id, title, status')
    .eq('userId', userId);
  
  const books: Pick<Book, 'id' | 'title' | 'status'>[] = booksData || [];
  console.log(`[Stats API] Fetched books for calculation:`, { booksCount: books.length, booksError: booksError?.message });

  if (booksError) {
    console.error('[Stats API] Error fetching books for calculation:', booksError);
    // Return a default structure, preserving the fetched/default readingGoal
    const errorStats: ReadingStats = {
      userId,
      booksRead: 0,
      pagesRead: 0, // If books fail, pagesRead might also be affected or calculated as 0
      booksInProgress: 0,
      booksWantToRead: 0,
      readingGoal: currentReadingGoal,
    };
    // Optionally, still try to upsert this error state or just return
    // For now, just return, as upserting zeros might not be desired on book fetch failure
    return errorStats;
  }

  // Calculate Total Pages Read from daily_reading_logs
  const { data: dailyLogs, error: logsError } = await supabase
    .from('daily_reading_logs')
    .select('pages_read_on_date')
    .eq('user_id', userId); // Make sure 'user_id' is the correct column name

  let totalPagesFromLogs = 0;
  if (dailyLogs && !logsError) {
    totalPagesFromLogs = dailyLogs.reduce((sum, log) => sum + (log.pages_read_on_date || 0), 0);
  } else if (logsError) {
    console.error('[Stats API] Error fetching daily_reading_logs for pagesRead:', logsError);
    // pagesRead will remain 0 if logsError
  }
  console.log(`[Stats API] Calculated totalPagesFromLogs:`, totalPagesFromLogs);

  const newStats: ReadingStats = {
    userId,
    booksRead: books.filter((book) => book.status === "completed").length,
    pagesRead: totalPagesFromLogs,
    booksInProgress: books.filter((book) => book.status === "reading").length,
    booksWantToRead: books.filter((book) => book.status === "want-to-read").length,
    readingGoal: currentReadingGoal, // Use fetched or default goal
  };
  console.log(`[Stats API] Calculated newStats:`, newStats);

  // Save/update stats to Supabase
  console.log(`[Stats API] Attempting to upsert newStats into reading_stats for userId: ${userId}.`);
  const { error: upsertError } = await supabase
    .from('reading_stats')
    .upsert(newStats, { onConflict: 'userId' })
    .select(); 

  if (upsertError) {
    console.error('[Stats API] Error saving reading stats (upserting) for userId:', userId, upsertError);
    // If upsert fails, we might still want to return the calculated newStats
    // or handle the error more gracefully depending on requirements.
  } else {
    console.log(`[Stats API] Successfully upserted stats for userId: ${userId}.`);
  }

  return newStats;
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`[Stats API] GET request for user: ${user.id}`);
    const stats = await getReadingStats(user.id);
    console.log(`[Stats API] Final stats returned to client:`, stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Stats API] Error in GET handler:", error);
    // Ensure error is an instance of Error for better logging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Stats API] Error details:", errorMessage, error);
    return NextResponse.json({ error: "Failed to fetch stats", details: errorMessage }, { status: 500 });
  }
}