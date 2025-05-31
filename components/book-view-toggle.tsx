"use client"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export function BookViewToggle() {
  const [viewMode, setViewMode] = useLocalStorage<"grid" | "list">("book-view-mode", "grid")
  
  return (
    <div className="flex space-x-2">
      <Button 
        variant={viewMode === "grid" ? "default" : "outline"} 
        size="sm"
        onClick={() => setViewMode("grid")}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button 
        variant={viewMode === "list" ? "default" : "outline"} 
        size="sm"
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
} 