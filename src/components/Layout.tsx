import { ReactNode, useState, useEffect, useRef } from "react";
import { useLoadable } from "atom.io/react";
import Header from "./Header";
import CategoryNav from "./CategoryNav";
import {
  categoryIdsAtom,
  getCategoryIdPlaceholders
} from "@/atoms";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const categoryIds = useLoadable(categoryIdsAtom, getCategoryIdPlaceholders())
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (categoryIds instanceof Error) return null;

  // Scroll Spy Logic
  useEffect(() => {
    const scrollableElement = contentRef.current;
    if (categoryIds.loading || !scrollableElement) return;

    const handleScroll = () => {
      const scrollY = scrollableElement.scrollTop;
      const sections = Array.from(scrollableElement.querySelectorAll("[id]")) as HTMLElement[];
      let currentActive: string | null = null;

      for (const section of sections) {
        const sectionTop = section.offsetTop - 100; // Adjust for some offset
        const sectionBottom = sectionTop + section.offsetHeight;

        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          currentActive = section.id;
        }
      }
      setActiveCategoryId(currentActive);
    };

    scrollableElement.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => scrollableElement.removeEventListener("scroll", handleScroll);
  }, [categoryIds.loading]); // Rerun when loading is done

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-y-auto">
        <div className="sticky top-0 h-full">
          {/* This div now correctly positions CategoryNav below the header and fixes its height */}
          {/* On mobile (default), w-16 matches CategoryNav's fixed width, ensuring main content is offset */}
          {/* On md screens and up, it takes w-64 (adjust as needed) */}
          {/* overflow-y-auto allows categories to scroll if they exceed the available height */}
          <CategoryNav activeCategoryId={activeCategoryId} />
        </div>

        <main
          ref={contentRef}
          className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
