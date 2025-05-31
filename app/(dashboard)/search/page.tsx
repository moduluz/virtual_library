"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpenCheck, Filter } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { BookDisplay } from "@/components/book-display"
import { Book } from "@/lib/supabase"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState({
    status: [] as string[],
    genres: [] as string[],
    rating: null as number | null,
  })
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 500)
  
  // Perform search when query or filters change
  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery && Object.values(filters).every(f => !f || (Array.isArray(f) && f.length === 0))) {
        setSearchResults([])
        return
      }
      
      setLoading(true)
      
      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(debouncedQuery)}`, {
          method: 'POST',
          body: JSON.stringify({ filters }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedQuery, filters])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Books</h1>
        <p className="text-muted-foreground">Find books in your library</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-6">
          <Accordion type="single" collapsible defaultValue="filters">
            <AccordionItem value="filters">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Status</h3>
                    <div className="space-y-2">
                      {["reading", "completed", "want-to-read"].map((status) => (
                        <div key={status} className="flex items-center">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                status: checked 
                                  ? [...prev.status, status]
                                  : prev.status.filter(s => s !== status)
                              }))
                            }}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="ml-2 text-sm font-medium capitalize"
                          >
                            {status.replace('-', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <Input
              placeholder="Search by title, author, or genre..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pr-10"
            />
            {loading && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          
          {searchResults.length > 0 ? (
            <BookDisplay books={searchResults} />
          ) : (
            <div className="text-center py-12">
              <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No books found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 