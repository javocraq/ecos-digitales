import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LoadingGrid } from "@/components/LoadingGrid";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Article = lazy(() => import("./pages/Article"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Toolbox = lazy(() => import("./pages/Toolbox"));
const ToolDetail = lazy(() => import("./pages/ToolDetail"));
const Search = lazy(() => import("./pages/Search"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="container py-8">
      <LoadingGrid />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Jobs />} />
            <Route path="/noticias" element={<Index />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/noticias/:slug" element={<Article />} />
            <Route path="/trabajos/:slug" element={<JobDetail />} />
            <Route path="/toolbox" element={<Toolbox />} />
            <Route path="/toolbox/:slug" element={<ToolDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
