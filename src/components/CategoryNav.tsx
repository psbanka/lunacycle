import { Button } from "@/components/ui/button";

type NavData =
  | {
      id: string;
      name: string;
      emoji: string;
    }[]

interface NavBarProps {
  categories: NavData | null;
  activeCategoryId: string | null;
}

export default function CategoryNav({ categories, activeCategoryId }: NavBarProps) {
  const renderCategoryLinks = () => {
    if (!categories) return null;

    if (
      !Array.isArray(categories) ||
      (categories.length > 0 &&
        !("id" in categories[0]))
    ) {
      console.error("Invalid data format for category links:", categories);
      return null;
    }

    return categories.map((category) => {
      if (category == null) {
        console.warn("Missing category data:", category);
        return null;
      }

      const { id, name, emoji } = category;

      if (!id || !name) {
        console.warn("Missing id or name in category data:", category);
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
  <nav className="w-full h-full bg-background">
    <div className="flex flex-col items-center justify-start space-y-2 p-2 md:items-center md:justify-around md:space-y-0  md:p-4">
      {renderCategoryLinks()}
    </div>
  </nav>
  );
}
