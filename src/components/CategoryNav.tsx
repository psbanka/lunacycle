import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutTemplate, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type NavData =
  | {
      categoryId: string;
      category: { name: string; emoji: string };
    }[]
  | {
      templateCategoryId: string;
      templateCategory: { name: string; emoji: string };
    }[];

interface NavBarProps {
  data: NavData | null;
  activeCategoryId: string | null;
}

export default function CategoryNav({ data, activeCategoryId }: NavBarProps) {
  const renderCategoryLinks = () => {
    if (!data) return null;

    if (
      !Array.isArray(data) ||
      (data.length > 0 &&
        !("categoryId" in data[0]) &&
        !("templateCategoryId" in data[0]))
    ) {
      console.error("Invalid data format for category links:", data);
      return null;
    }

    return data.map((item) => {
      const { categoryId, category } = item as {
        categoryId: string;
        category: { name: string; emoji: string };
      };
      const { templateCategoryId, templateCategory } = item as {
        templateCategoryId: string;
        templateCategory: { name: string; emoji: string };
      };

      if (category == null) {
        console.warn("Missing category data:", item);
        return null;
      }

      const id = categoryId || templateCategoryId;
      const { name, emoji } = category || templateCategory;

      if (!id || !name) {
        console.warn("Missing id or name in category data:", item);
        return null;
      }
      const variant = activeCategoryId === id ? "default" : "ghost";
      const scroll = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      };

      return (
        <Button
          key={id}
          variant={variant}
          className="w-full justify-start gap-2"
          onClick={scroll}>
          {emoji}
          <span className="hidden lg:inline">{name}</span>
        </Button>
      );
    });
  };

  return (
    <nav className="fixed top-16 left-0 w-16 h-full bg-background border-r z-50 md:static md:top-auto md:left-auto md:w-auto md:h-auto md:border-t md:border-r-0 md:border-b-0">
      <div className="flex flex-col items-center justify-start space-y-2 p-2 md:items-center md:justify-around md:space-y-0  md:p-4">
        {renderCategoryLinks()}
      </div>
    </nav>
  );
}
