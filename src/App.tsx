import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ADMIN_BASE_PATH } from "@/config/admin";

// Lazy load public pages
const Index = lazy(() => import("./pages/Index"));
const Article = lazy(() => import("./pages/Article"));
const Toolbox = lazy(() => import("./pages/Toolbox"));
const ToolDetail = lazy(() => import("./pages/ToolDetail"));
const Search = lazy(() => import("./pages/Search"));
const EditionsIndex = lazy(() => import("./pages/EditionsIndex"));
const EditionDetail = lazy(() => import("./pages/EditionDetail"));
const SobreNosotros = lazy(() => import("./pages/SobreNosotros"));
const Prensa = lazy(() => import("./pages/Prensa"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const NewsletterConfirmado = lazy(() => import("./pages/newsletter/Confirmado"));
const NewsletterDesuscrito = lazy(() => import("./pages/newsletter/Desuscrito"));
const NewsletterError = lazy(() => import("./pages/newsletter/Error"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const AdminEditor = lazy(() => import("./pages/admin/Editor"));
const AdminEditions = lazy(() => import("./pages/admin/Editions"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminBanner = lazy(() => import("./pages/admin/Banner"));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min default
      gcTime: 1000 * 60 * 10,    // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/noticias" element={<Index />} />
              <Route path="/buscar" element={<Search />} />
              <Route path="/noticias/:slug" element={<Article />} />
              <Route path="/toolbox" element={<Toolbox />} />
              <Route path="/toolbox/:slug" element={<ToolDetail />} />
              <Route path="/ediciones" element={<EditionsIndex />} />
              <Route path="/ediciones/:slug" element={<EditionDetail />} />
              <Route path="/sobre-nosotros" element={<SobreNosotros />} />
              <Route path="/prensa" element={<Prensa />} />
              <Route path="/newsletter" element={<Newsletter />} />
              <Route path="/newsletter/confirmado" element={<NewsletterConfirmado />} />
              <Route path="/newsletter/desuscrito" element={<NewsletterDesuscrito />} />
              <Route path="/newsletter/error" element={<NewsletterError />} />

              {/* Admin routes — hidden, no public links */}
              <Route path={ADMIN_BASE_PATH} element={<AdminLogin />} />
              <Route path={`${ADMIN_BASE_PATH}/dashboard`} element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/articulos`} element={<ProtectedRoute><AdminArticles /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/editor`} element={<ProtectedRoute><AdminEditor /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/editor/:id`} element={<ProtectedRoute><AdminEditor /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/ediciones`} element={<ProtectedRoute><AdminEditions /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/video`} element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
              <Route path={`${ADMIN_BASE_PATH}/banner`} element={<ProtectedRoute><AdminBanner /></ProtectedRoute>} />
              {/* alias legacy: /configuracion → /video (por si algún bookmark viejo) */}
              <Route path={`${ADMIN_BASE_PATH}/configuracion`} element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
