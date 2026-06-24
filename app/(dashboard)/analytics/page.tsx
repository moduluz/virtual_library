"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ReadingProgressChart, GenreDistributionChart, ReadingGoalChart, MonthlyBooksChart } from "@/components/reading-charts"
import { BookOpen, BookText, BookMarked } from "lucide-react"

type ActiveTab = "overview" | "genres" | "progress" | "goals";

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  genre?: string | null;
  rating?: number | null;
  dateAdded: string;
}

interface ProgressDataPoint {
  date: string;
  pagesRead: number;
}

export default function AnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    booksRead: 0, pagesRead: 0, booksInProgress: 0,
    booksWantToRead: 0, readingGoal: 12,
  })
  const [activeTab, setActiveTab] = useState<ActiveTab>("progress");
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [booksRes, statsRes, progressRes] = await Promise.all([
          fetch("/api/books"),
          fetch("/api/stats"),
          fetch("/api/reading-progress-over-time"),
        ]);

        if (booksRes.ok) setBooks(await booksRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (progressRes.ok) setProgressData(await progressRes.json());
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (sessionStatus === "authenticated") {
      fetchData();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  const monthlyData = generateMonthlyData(books);
  const genreData = generateGenreData(books);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Monthly Reading</h3>
              <p className="text-sm text-muted-foreground">Number of books completed each month</p>
            </div>
            <div className="h-[300px]"><MonthlyBooksChart data={monthlyData} /></div>
          </div>
        );
      case "genres":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Genre Distribution</h3>
              <p className="text-sm text-muted-foreground">Books by genre in your library</p>
            </div>
            <div className="h-[300px]"><GenreDistributionChart data={genreData} /></div>
          </div>
        );
      case "progress":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Reading Progress</h3>
              <p className="text-sm text-muted-foreground">Pages read over time</p>
            </div>
            <div className="h-[300px]"><ReadingProgressChart data={progressData} /></div>
          </div>
        );
      case "goals":
        return (
          <div className="bg-card p-6 rounded-lg shadow mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Reading Goal</h3>
              <p className="text-sm text-muted-foreground">Track your progress toward your annual reading goal</p>
            </div>
            <div className="flex justify-center">
              <div className="h-[300px] w-[300px]">
                <ReadingGoalChart completed={stats.booksRead} goal={stats.readingGoal} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reading Analytics</h1>
        <p className="text-muted-foreground">Track your reading habits and progress</p>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Books Read</h3>
                <BookText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.booksRead}</div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Pages Read</h3>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.pagesRead}</div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Currently Reading</h3>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.booksInProgress}</div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Want to Read</h3>
                <BookMarked className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{stats.booksWantToRead}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex border-b">
              {(["overview", "genres", "progress", "goals"] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 -mb-px text-sm font-medium border-b-2
                    ${activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600"
                    }
                    focus:outline-none focus:border-primary transition-colors duration-150 ease-in-out
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="mt-4">{renderTabContent()}</div>
          </div>
        </>
      )}
    </div>
  )
}

function generateMonthlyData(books: Book[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const data = months.map((name) => ({ name, books: 0 }));

  books.forEach((book) => {
    if (book.status === "completed") {
      const dateCompletedField = (book as any).dateCompleted;
      if (dateCompletedField) {
        try {
          const completedDate = new Date(dateCompletedField);
          if (!isNaN(completedDate.getTime()) && completedDate.getFullYear() === currentYear) {
            const monthIndex = completedDate.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) data[monthIndex].books++;
          }
        } catch {}
      }
    }
  });

  return data;
}

function generateGenreData(books: Book[]) {
  const genreCounts: { [genre: string]: number } = {};
  books.forEach((book) => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    }
  });
  return Object.entries(genreCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}
