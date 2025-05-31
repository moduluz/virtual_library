import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBookCard } from "@/components/skeleton-book-card"

export default function BooksLoading() {
  return (
    <div className="space-y-6">
      <div>
        {/* Skeleton for header */}
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Skeleton for TabsList */}
      <div className="flex space-x-4 border-b pb-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Skeleton for BookGrid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <SkeletonBookCard key={index} />
        ))}
      </div>
    </div>
  )
} 