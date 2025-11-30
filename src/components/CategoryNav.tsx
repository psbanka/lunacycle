import { Button } from "@/components/ui/button";
import { useLoadable, useO } from "atom.io/react";
import { getState } from "atom.io";
import { useEffect, useState } from "react";
import { categoryIdsAtom, categoriesAtom, EMPTY_CATEGORY } from "@/atoms";

interface NavBarProps {
  activeCategoryId: string | null;
}

interface ButtonData {
  emoji: string;
  name: string;
  categoryId: string;
  variant: "link" | "default";
  scroll: () => void;
}

export default function CategoryNav({ activeCategoryId }: NavBarProps) {
  const categoryIds = useLoadable(categoryIdsAtom, []);
  const [buttonData, setButtonData] = useState<ButtonData[]>([]);

  useEffect(() => {
    const generateButtonData = async () => {
      if (!categoryIds) return null;

      const buttonData = categoryIds.value.map(async (categoryId) => {
        const category = await getState(categoriesAtom, categoryId);
        if (category == null || category instanceof Error) {
          console.warn("Missing category data:", category);
          return null;
        }
        const { emoji, name } = category;

        if (!categoryId || !name) {
          console.warn("Missing id or name in category data:", category);
          return null;
        }
        const variant = activeCategoryId === categoryId ? "default" : "ghost";
        const scroll = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          const element = document.getElementById(categoryId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        };

        return {
          categoryId,
          variant,
          scroll,
          emoji,
          name,
        };
      });

      return Promise.all(buttonData).then((buttonData) => {
        const data = buttonData.filter((data) => data !== null) as ButtonData[];
        setButtonData(data);
      });
    };
    generateButtonData();
  }, [activeCategoryId, categoryIds]);

  return (
    <nav className="w-full h-full bg-background">
      <div className="flex flex-col items-center justify-start space-y-2 md:items-center md:justify-around md:space-y-0  md:p-4">
        {buttonData.map((data) => (
          <Button
            key={data.categoryId}
            variant={data.variant}
            className="w-full justify-start gap-2 text-2xl"
            onClick={data.scroll}>
            {data.emoji}
            <span className="hidden lg:inline">{data.name}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
