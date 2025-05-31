import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCollections } from "@/lib/collection-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Library, Plus } from "lucide-react"

export default async function CollectionsPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect("/sign-in")
  }
  
  const collections = await getCollections(user.id)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Collections</h1>
          <p className="text-muted-foreground">Organize your books into custom collections</p>
        </div>
        
        <Link href="/collections/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </Link>
      </div>
      
      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Library className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No collections yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create collections to organize your books by genre, theme, or any way you like.
              </p>
              <Link href="/collections/create">
                <Button className="mt-4">
                  Create Your First Collection
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link href={`/collections/${collection.id}`} key={collection.id}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <p className="mt-2 text-sm">{collection.bookIds.length} books</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 