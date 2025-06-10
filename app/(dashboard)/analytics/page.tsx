"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Book } from "@/lib/supabase"
import { ReadingProgressChart, GenreDistributionChart, ReadingGoalChart, MonthlyBooksChart } from "@/components/reading-charts"
import { BookOpen, BookText, BookMarked } from "lucide-react"

// Define a type for the active tab
type ActiveTab = "overview" | "genres" | "progress" | "goals";

interface ProgressDataPoint {
  date: string;
  pagesRead: number;
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    booksRead: 0,
    pagesRead: 0,
    booksInProgress: 0,
    booksWantToRead: 0,
    readingGoal: 12, 
  })
  const [activeTab, setActiveTab] = useState<ActiveTab>("progress"); // Set to "progress" to test
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);

  useEffect(() => {
    console.log("AnalyticsPage useEffect triggered. isLoaded:", isLoaded, "user:", !!user); // <--- ADD THIS

    async function fetchData() {
      console.log("fetchData called. User ID:", user?.id); // <--- ADD THIS
      if (!user) {
        console.log("fetchData: No user, returning."); // <--- ADD THIS
        setLoading(false); // Ensure loading is set to false if no user
        return;
      }
      
      setLoading(true);
      try {
        // Fetch books
        console.log("fetchData: Fetching books..."); // <--- ADD THIS
        const booksResponse = await fetch("/api/books");
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        } else {
          console.error("Failed to fetch books from API:", booksResponse.status, await booksResponse.text());
        }
        
        // Fetch reading stats
        console.log("fetchData: Fetching stats..."); // <--- ADD THIS
        const statsResponse = await fetch("/api/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          console.error("Failed to fetch stats from API:", statsResponse.status, await statsResponse.text());
        }

        // Fetch reading progress over time
        console.log("fetchData: Fetching reading progress over time..."); // <--- ADD THIS
        const progressResponse = await fetch("/api/reading-progress-over-time");
        console.log("Progress API response status:", progressResponse.status); // <--- THIS IS KEY
        if (progressResponse.ok) {
          const progressChartData = await progressResponse.json();
          console.log("Fetched progressChartData:", progressChartData); // <--- THIS IS KEY
          setProgressData(progressChartData);
        } else {
          console.error("Failed to fetch reading progress data:", progressResponse.status, await progressResponse.text());
        }

      } catch (error) {
        console.error("Error in fetchData:", error) // <--- MODIFIED THIS
      } finally {
        console.log("fetchData: finally block, setting loading to false."); // <--- ADD THIS
        setLoading(false)
      }
    }
    
    if (isLoaded && user) {
      console.log("AnalyticsPage useEffect: isLoaded and user are true, calling fetchData."); // <--- ADD THIS
      fetchData();
    } else {
      console.log("AnalyticsPage useEffect: isLoaded or user is false, not calling fetchData yet."); // <--- ADD THIS
      if (!user && isLoaded) { // If Clerk has loaded but there's no user
        setLoading(false); // Stop loading indicator
      }
    }
  }, [user, isLoaded]); // Dependencies are correct
  
  // Generate monthly data
  const monthlyData = generateMonthlyData(books)
  
  // Generate genre distribution data
  console.log("Books state passed to generateGenreData:", books);
  const genreData = generateGenreData(books);
  console.log("Output of generateGenreData (for chart):", genreData);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4"> {/* Replaced Card */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h3 className="text-lg font-semibold">Monthly Reading</h3> {/* Replaced CardTitle */}
              <p className="text-sm text-muted-foreground">
                Number of books completed each month
              </p> {/* Replaced CardDescription */}
            </div>
            <div> {/* Replaced CardContent */}
              <div className="h-[300px]">
                <MonthlyBooksChart data={monthlyData} />
              </div>
            </div>
          </div>
        );
      case "genres":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4"> {/* Replaced Card */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h3 className="text-lg font-semibold">Genre Distribution</h3> {/* Replaced CardTitle */}
              <p className="text-sm text-muted-foreground">
                Books by genre in your library
              </p> {/* Replaced CardDescription */}
            </div>
            <div> {/* Replaced CardContent */}
              <div className="h-[300px]">
                <GenreDistributionChart data={genreData} />
              </div>
            </div>
          </div>
        );
      case "progress":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4"> {/* Replaced Card */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h3 className="text-lg font-semibold">Reading Progress</h3> {/* Replaced CardTitle */}
              <p className="text-sm text-muted-foreground">
                Pages read over time
              </p> {/* Replaced CardDescription */}
            </div>
            <div> {/* Replaced CardContent */}
              <div className="h-[300px]">
                <ReadingProgressChart data={progressData} /> {/* Use state variable here */}
              </div>
            </div>
          </div>
        );
      case "goals":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4"> {/* Replaced Card */}
            <div className="mb-4"> {/* Replaced CardHeader */}
              <h3 className="text-lg font-semibold">2024 Reading Goal</h3> {/* Replaced CardTitle */}
              <p className="text-sm text-muted-foreground">
                Track your progress toward your annual reading goal
              </p> {/* Replaced CardDescription */}
            </div>
            <div className="flex justify-center"> {/* Replaced CardContent */}
              <div className="h-[300px] w-[300px]">
                <ReadingGoalChart 
                  completed={stats.booksRead} 
                  goal={stats.readingGoal} 
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added some padding for overall layout */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reading Analytics</h1>
        <p className="text-muted-foreground">Track your reading habits and progress</p>
      </div>
      
      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div> {/* Using purple-700 as an example color */}
        </div>
      ) : (
        <>
          {/* Stat Cards - Replaced Shadcn Cards with basic divs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card p-4 rounded-lg shadow"> {/* Replaced Card */}
              <div className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Replaced CardHeader */}
                <h3 className="text-sm font-medium">Books Read</h3> {/* Replaced CardTitle */}
                <BookText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div> {/* Replaced CardContent */}
                <div className="text-2xl font-bold">{stats.booksRead}</div>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow"> {/* Replaced Card */}
              <div className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Replaced CardHeader */}
                <h3 className="text-sm font-medium">Pages Read</h3> {/* Replaced CardTitle */}
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div> {/* Replaced CardContent */}
                <div className="text-2xl font-bold">{stats.pagesRead}</div>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow"> {/* Replaced Card */}
              <div className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Replaced CardHeader */}
                <h3 className="text-sm font-medium">Currently Reading</h3> {/* Replaced CardTitle */}
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div> {/* Replaced CardContent */}
                <div className="text-2xl font-bold">{stats.booksInProgress}</div>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg shadow"> {/* Replaced Card */}
              <div className="flex flex-row items-center justify-between space-y-0 pb-2"> {/* Replaced CardHeader */}
                <h3 className="text-sm font-medium">Want to Read</h3> {/* Replaced CardTitle */}
                <BookMarked className="h-4 w-4 text-muted-foreground" />
              </div>
              <div> {/* Replaced CardContent */}
                <div className="text-2xl font-bold">{stats.booksWantToRead}</div>
              </div>
            </div>
          </div>
          
          {/* Manual Tabs Implementation */}
          <div className="space-y-4">
            <div className="flex border-b"> {/* Replaced TabsList */}
              {(["overview", "genres", "progress", "goals"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 -mb-px text-sm font-medium border-b-2
                    ${activeTab === tab 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    focus:outline-none focus:border-primary transition-colors duration-150 ease-in-out
                  `} // Replaced TabsTrigger styling
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Tab Content Area */}
            <div className="mt-4"> {/* Replaced TabsContent structure */}
              {renderTabContent()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Helper functions to generate chart data (Unchanged)
function generateMonthlyData(books: Book[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentYear = new Date().getFullYear()
  
  const data = months.map(name => ({ name, books: 0 }))
  let processedBooksWithDate = 0; // Counter for books successfully processed for the chart
  
  books.forEach(book => {
    if (book.status === "completed") {
      // Attempt to access dateCompleted. Original comments suggested this might often be undefined.
      const dateCompletedField = (book as Book & { dateCompleted?: string | Date }).dateCompleted; 
      
      if (dateCompletedField) { 
        try {
          const completedDate = new Date(dateCompletedField);
          // Check if completedDate is a valid date and in the current year
          if (!isNaN(completedDate.getTime()) && completedDate.getFullYear() === currentYear) {
            const monthIndex = completedDate.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) { // Ensure monthIndex is valid
                 data[monthIndex].books++;
                 processedBooksWithDate++; // Increment if date was valid and processed
            }
          }
        } catch (e) {
          console.error("Error parsing dateCompleted for book:", book.id, dateCompletedField, e);
        }
      }
    }
  })
  
  // Log a warning if there are completed books but none had valid dates for the current year's chart
  const completedBooksCount = books.filter(b => b.status === "completed").length;
  if (completedBooksCount > 0 && processedBooksWithDate === 0) {
    console.warn(
      "[AnalyticsPage/generateMonthlyData] Found", completedBooksCount, "completed book(s), but none had 'dateCompleted' entries usable for the current year's monthly chart. The chart may appear empty or incomplete."
    );
  }
  
  return data
}

interface GenreCounts {
  [genre: string]: number;
}

function generateGenreData(books: Book[]) {
  const genreCounts: GenreCounts = {};
  
  books.forEach(book => {
    if (book.genre) {
      const genreKey: string = book.genre; 
      genreCounts[genreKey] = (genreCounts[genreKey] || 0) + 1;
    }
  });
  
  return Object.entries(genreCounts)
    .map(([name, count]) => ({ name, value: count as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}