import { useLoadable } from "atom.io/react"
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { categoryIdsAtom, backlogTaskIdsAtom } from "@/atoms";
import { BacklogCategorySection } from "@/components/BacklogCategorySection";

export default function Backlog() {
  const categoryIds = useLoadable(categoryIdsAtom, []);
  const backlogTaskIds = useLoadable(backlogTaskIdsAtom, []);

  if (categoryIds.error) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {backlogTaskIds.value.length == 0 ? (
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">No Backlog Tasks!</h1>
            <div className="mb-8 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => console.log("implement me")}>
                <PlusCircle className="h-4 w-4" />
                Add Backlog Tasks
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="max-w-6xl mx-auto">


        <h2 className="text-2xl font-semibold mb-6">Categories</h2>

        <Separator className="my-8" />

        {categoryIds.value.map((categoryId) => (
          <BacklogCategorySection
            key={categoryId}
            categoryId={categoryId}
          />
        ))}
      </div>
    </div>
  );
}
