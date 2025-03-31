
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LunarPhase from "@/components/LunarPhase";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LunarPhase size="xl" />
      
      <h1 className="text-4xl font-bold mt-8 mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        This page has drifted beyond the lunar orbit
      </p>
      
      <Link to="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;
