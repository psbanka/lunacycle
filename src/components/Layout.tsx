import { ReactNode, useState, useEffect, useRef } from "react";
import Header from "./Header";
import CategoryNav from "./CategoryNav";
import { useLocation } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { categories, currentMonth, template, loadingTasks } = useTask();
  const location = useLocation();
  const [navData, setNavData] = useState<any>(null); // FIXME: type this
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadingTasks) return;
    if (location.pathname === "/" && currentMonth) {
      setNavData(categories);
    } else if (location.pathname === "/template" && template) {
      setNavData(categories);
    } else {
      setNavData(null);
    }
  }, [location.pathname, currentMonth, template, loadingTasks, categories]);

  // Scroll Spy Logic
  useEffect(() => {
    if (!navData || !contentRef.current) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sections = Array.from(document.querySelectorAll("[id]")) as HTMLElement[];
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

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [navData]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-y-auto">
        <div className="sticky top-0 h-full">
          {/* This div now correctly positions CategoryNav below the header and fixes its height */}
          {/* On mobile (default), w-16 matches CategoryNav's fixed width, ensuring main content is offset */}
          {/* On md screens and up, it takes w-64 (adjust as needed) */}
          {/* overflow-y-auto allows categories to scroll if they exceed the available height */}
          <CategoryNav categories={navData} activeCategoryId={activeCategoryId} />
        </div>

        <main
          ref={contentRef}
          className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
