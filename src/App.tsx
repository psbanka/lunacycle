import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TRPCProvider } from "./lib/trpc";
import { TaskProvider } from "./contexts/TaskContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
// TODO: MOVE FILE
import Template from "./pages/Template";
import Backlog from "./pages/Backlog";
import Goals from "./pages/Goals";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { trpc } from "./api";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Route guard for protected routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Check if we're still loading auth state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// App Core without providers for use inside providers
const AppCore = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/template"
        element={
          <ProtectedRoute>
            <Layout>
              <Template />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/backlog"
        element={
          <ProtectedRoute>
            <Layout>
              <Backlog />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <Layout>
              <Goals />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App with all providers
const App = () => {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc
  /*
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          // TODO: remove duplicate stuff?
          url: `http://${env.VITE_BACKEND_ORIGIN}/api/`,
        }),
      ],
    })
      */
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {/*<ReactQueryDevtools initialIsOpen={false} /> */}
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <TaskProvider>
              <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppCore />
                </BrowserRouter>
              </TaskProvider>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default App;
