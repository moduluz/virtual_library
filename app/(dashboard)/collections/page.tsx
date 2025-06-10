import { redirect } from "next/navigation"
import { getCollections } from "@/lib/collection-service"
import { currentUser } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { CollectionCard } from "@/components/collections/CollectionCard"; // <<< ENSURE THIS LINE IS EXACTLY THIS (PascalCase)
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Collection } from "@/types"

export default async function CollectionsPage() {
  const user = await currentUser()
  
  if (!user || !user.id) {
    redirect("/sign-in")
  }

  const collections: Collection[] = await getCollections(user.id)
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Collections</h1>
          <p className="text-muted-foreground">Organize your books into custom collections</p>
        </div>
        
        <Link href="/collections/new" passHref legacyBehavior>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Collection
          </Button>
        </Link>
      </div>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">You haven't created any collections yet.</p>
          <Link href="/collections/new" passHref legacyBehavior>
             <Button className="mt-4">Create Your First Collection</Button>
          </Link>
        </div>
      )}
    </div>
  )
}