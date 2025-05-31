import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonBookCard() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[2/3] relative bg-muted">
        {/* Simulate cover image area */}
        <Skeleton className="w-full h-full" />
      </div>
      {/* Optionally add skeleton lines for title/author if needed */}
      {/* <div className="p-2 space-y-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div> */}
    </Card>
  )
} 