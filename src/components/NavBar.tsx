
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutTemplate, Moon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  
  const links = [
    {
      href: "/",
      label: "Current Month",
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      href: "/template",
      label: "Template",
      icon: <LayoutTemplate className="h-5 w-5" />,
    },
  ];
  
  return (
    <nav className="w-auto bg-background z-50 border-t border-t-0 border-r-0 border-r">
      <div className="flex flex-row items-center justify-around justify-start p-2 p-4">
        {links.map(({ href, label, icon }) => {
          const isActive = location.pathname === href;
          
          return (
            <Link 
              key={href} 
              to={href}
              className="w-full"
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive ? "bg-primary text-primary-foreground" : ""
                )}
              >
                {icon}
                <span className="hidden lg:inline">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
