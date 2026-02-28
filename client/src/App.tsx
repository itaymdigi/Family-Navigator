import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AiChatBot from "@/components/AiChatBot";
import AuthPage from "@/pages/AuthPage";
import { createContext, useContext } from "react";

type AuthUser = { id: number; username: string; displayName: string; role: string } | null;

const AuthContext = createContext<{ user: AuthUser; isLoading: boolean; refetch: () => void }>({
  user: null,
  isLoading: true,
  refetch: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, refetch } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={refetch} />;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: false, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate>
          <Router />
          <AiChatBot />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
