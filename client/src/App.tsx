import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const CreateArt = lazy(() => import("./pages/CreateArt"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Projects = lazy(() => import("./pages/Projects"));
const MetaSettings = lazy(() => import("./pages/MetaSettings"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BatchAdaptation = lazy(() => import("./pages/BatchAdaptation"));
const UserAdminPanel = lazy(() => import("./pages/UserAdminPanel"));
const CentralizedScheduling = lazy(() => import("./pages/CentralizedScheduling"));
const ExecutionMonitor = lazy(() => import("./pages/ExecutionMonitor"));
const PlatformConnections = lazy(() => import("./pages/PlatformConnections"));
const CalendarSchedule = lazy(() => import("./pages/CalendarSchedule"));
const RealTimeAnalytics = lazy(() => import("./pages/RealTimeAnalytics"));
const CompetitorAnalysis = lazy(() => import("./pages/CompetitorAnalysis"));
const WhatsAppBusiness = lazy(() => import("./pages/WhatsAppBusiness"));
const WhatsAppConfig = lazy(() => import("./pages/WhatsAppConfig"));
const MediaUpload = lazy(() => import("./pages/MediaUpload"));
const ScheduleVideo = lazy(() => import("./pages/ScheduleVideo"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Landing = lazy(() => import("./pages/Landing"));
const Captions = lazy(() => import("./pages/Captions"));
const SocialConnections = lazy(() => import("./pages/SocialConnections"));
const Templates = lazy(() => import("./pages/Templates"));
const History = lazy(() => import("./pages/History"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const SupportCenter = lazy(() => import("./pages/SupportCenter"));
const Security = lazy(() => import("./pages/Security"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Billing = lazy(() => import("./pages/Billing"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const ScheduleVisual = lazy(() => import("./pages/ScheduleVisual"));
const ConnectSocial = lazy(() => import("./pages/ConnectSocial"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));

// Platform Managers
const PlatformHub = lazy(() => import("./pages/platforms/PlatformHub"));
const FacebookManager = lazy(() => import("./pages/platforms/FacebookManager"));
const InstagramManager = lazy(() => import("./pages/platforms/InstagramManager"));
const TikTokManager = lazy(() => import("./pages/platforms/TikTokManager"));
const WhatsAppManager = lazy(() => import("./pages/platforms/WhatsAppManager"));

// Loading component for Suspense
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/app" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create" component={CreateArt} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/projects" component={Projects} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/captions" component={Captions} />
        <Route path="/social-connections" component={SocialConnections} />
        <Route path="/templates" component={Templates} />
        <Route path="/history" component={History} />
        <Route path="/meta-settings" component={MetaSettings} />
        <Route path="/batch-adaptation" component={BatchAdaptation} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/centralized-scheduling" component={CentralizedScheduling} />
        <Route path="/execution-monitor" component={ExecutionMonitor} />
        <Route path="/platform-connections" component={PlatformConnections} />
        <Route path="/calendar" component={CalendarSchedule} />
        <Route path="/real-time-analytics" component={RealTimeAnalytics} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/support-center" component={SupportCenter} />
        <Route path="/security" component={Security} />
        <Route path="/competitor-analysis" component={CompetitorAnalysis} />
        <Route path="/whatsapp" component={WhatsAppBusiness} />
        <Route path="/whatsapp/config" component={WhatsAppConfig} />
        <Route path="/media/upload" component={MediaUpload} />
        <Route path="/schedule-video" component={ScheduleVideo} />
        <Route path="/upgrade" component={Upgrade} />
        <Route path="/billing" component={Billing} />
        <Route path="/create-post" component={CreatePost} />
        <Route path="/schedule-visual" component={ScheduleVisual} />
        <Route path="/connect-social" component={ConnectSocial} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/settings" component={Settings} />
        
        {/* Platform Managers */}
        <Route path="/platforms" component={PlatformHub} />
        <Route path="/platforms/facebook" component={FacebookManager} />
        <Route path="/platforms/instagram" component={InstagramManager} />
        <Route path="/platforms/tiktok" component={TikTokManager} />
        <Route path="/platforms/whatsapp" component={WhatsAppManager} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  
  // Public pages that don't need AppLayout
  const publicPages = ["/", "/pricing", "/landing", "/login", "/register", "/forgot-password"];
  const isPublicPage = publicPages.includes(location);

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <ErrorBoundary>
          <Switch>
            {/* Páginas Públicas que NÃO usam AppLayout */}
            <Route path="/">
              <Suspense fallback={<PageLoader />}><Landing /></Suspense>
            </Route>
            <Route path="/pricing">
              <Suspense fallback={<PageLoader />}><Pricing /></Suspense>
            </Route>
            <Route path="/landing">
              <Suspense fallback={<PageLoader />}><Landing /></Suspense>
            </Route>
            <Route path="/login">
              <Suspense fallback={<PageLoader />}><Login /></Suspense>
            </Route>
            <Route path="/register">
              <Suspense fallback={<PageLoader />}><Register /></Suspense>
            </Route>
            <Route path="/forgot-password">
              <Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>
            </Route>

            {/* Todas as outras rotas usam AppLayout */}
            <Route>
              <AppLayout>
                <Router />
              </AppLayout>
            </Route>
          </Switch>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
