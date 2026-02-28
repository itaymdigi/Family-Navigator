import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TripDashboard from "@/pages/TripDashboard";
import TripPlanner from "@/pages/TripPlanner";
import AiChatBot from "@/components/AiChatBot";
import AuthPage from "@/pages/AuthPage";
import { useConvexAuth } from "convex/react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TripDashboard} />
      <Route path="/trips/:id">
        {(params) => <TripPlanner tripId={params.id!} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) return null;

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
