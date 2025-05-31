"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@clerk/nextjs"
import { Book } from "@/lib/supabase"
import { ReadingProgressChart, GenreDistributionChart, ReadingGoalChart, MonthlyBooksChart } from "@/components/reading-charts"
import { BookOpen, BookText, BookMarked, TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    booksRead: 0,
    pagesRead: 0,
    booksInProgress: 0,
    booksWantToRead: 0,
    readingGoal: 12, // Default goal
  })

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        // Fetch books
        const booksResponse = await fetch("/api/books")
        if (booksResponse.ok) {
          const booksData = await booksResponse.json()
          setBooks(booksData)
        }
        
        // Fetch reading stats
        const statsResponse = await fetch("/api/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoaded && user) {
      fetchData()
    }
  }, [user, isLoaded])
  
  // Generate monthly data
  const monthlyData = generateMonthlyData(books)
  
  // Generate genre distribution data
  const genreData = generateGenreData(books)
  
  // Generate reading progress data
  const progressData = generateProgressData(books)

  return (
    <div className="space-y-6">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Books Read</CardTitle>
                <BookText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.booksRead}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pagesRead}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Reading</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.booksInProgress}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Want to Read</CardTitle>
                <BookMarked className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.booksWantToRead}</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
              <TabsTrigger value="progress">Reading Progress</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Reading</CardTitle>
                  <CardDescription>
                    Number of books completed each month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <MonthlyBooksChart data={monthlyData} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="genres" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Genre Distribution</CardTitle>
                  <CardDescription>
                    Books by genre in your library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <GenreDistributionChart data={genreData} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reading Progress</CardTitle>
                  <CardDescription>
                    Pages read over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ReadingProgressChart data={progressData} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>2024 Reading Goal</CardTitle>
                  <CardDescription>
                    Track your progress toward your annual reading goal
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-[300px] w-[300px]">
                    <ReadingGoalChart 
                      completed={stats.booksRead} 
                      goal={stats.readingGoal} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

// Helper functions to generate chart data
function generateMonthlyData(books: Book[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentYear = new Date().getFullYear()
  
  // Initialize with 0 counts
  const data = months.map(name => ({ name, books: 0 }))
  
  // Count books completed per month for current year
  books.forEach(book => {
    if (book.status === "completed") {
      const dateAdded = new Date(book.dateAdded)
      if (dateAdded.getFullYear() === currentYear) {
        const month = dateAdded.getMonth()
        data[month].books += 1
      }
    }
  })
  
  return data
}

function generateGenreData(books: Book[]) {
  const genreCounts = {}
  
  // Count books by genre
  books.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1
    }
  })
  
  // Convert to array format for chart
  return Object.entries(genreCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6) // Show top 6 genres
}

function generateProgressData(books: Book[]) {
  // In a real app, this would use actual reading sessions data
  // For demo, we'll create simulated progress over recent dates
  const data = []
  const now = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
      pagesRead: Math.floor(Math.random() * 50) + 10 // Random pages between 10-60
    })
  }
  
  return data
} 