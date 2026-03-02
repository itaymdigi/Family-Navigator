import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AiChatBot from "@/components/AiChatBot";
import AuthPage from "@/pages/AuthPage";
import { useConvexAuth } from "convex/react";

const TripDashboard = lazy(() => import("@/pages/TripDashboard"));
const TripPlanner = lazy(() => import("@/pages/TripPlanner"));

function PageSkeleton() {
  return (
    <div className="h-dvh bg-background flex flex-col" dir="rtl">
      <div className="h-16 bg-background border-b border-border px-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-32 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="flex-1 overflow-hidden p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/" component={TripDashboard} />
        <Route path="/trips/:id">
          {(params) => <TripPlanner tripId={params.id!} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) return <PageSkeleton />;

  return (
    <TooltipProvider>
      <Toaster />
      {isAuthenticated ? (
        <>
          <Router />
          <AiChatBot />
        </>
      ) : (
        <AuthPage />
      )}
    </TooltipProvider>
  );
}

export default App;
