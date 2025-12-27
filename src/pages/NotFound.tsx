import { useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentSession } from "@/services/auth";

const NotFound = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    getCurrentSession().then(({ session }) => {
      setIsLoggedIn(!!session);
    });
  }, [location.pathname]);

  if (isLoggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to={isLoggedIn ? "/admin" : "/cardapio"} replace />;
};

export default NotFound;
