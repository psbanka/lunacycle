
import { ReactNode } from "react";
import Header from "./Header";
import NavBar from "./NavBar";
import { useAuth } from "@/contexts/AuthContext";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex flex-1">
        {isAuthenticated && (
          <div className="hidden md:block">
            <NavBar />
          </div>
        )}
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
      
      {isAuthenticated && (
        <div className="md:hidden">
          <NavBar />
        </div>
      )}
    </div>
  );
}
