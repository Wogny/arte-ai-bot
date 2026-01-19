import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  Layers,
  Share2,
  MessageSquare,
  History,
  Zap,
  Shield,
  CreditCard,
  Loader2
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/login";
    }
  });

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Zap, label: "Criar Arte", href: "/create" },
    { icon: ImageIcon, label: "Galeria", href: "/gallery" },
    { icon: Calendar, label: "Agendamento", href: "/calendar" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Share2, label: "Conexões", href: "/social-connections" },
    { icon: Layers, label: "Projetos", href: "/projects" },
    { icon: MessageSquare, label: "Legendas", href: "/captions" },
    { icon: History, label: "Histórico", href: "/history" },
    { icon: CreditCard, label: "Assinatura", href: "/billing" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: Shield, label: "Admin", href: "/admin" });
  }

  // Se estiver carregando e não houver cache, mostramos o loader
  if (loading) {
    const cachedUser = localStorage.getItem("manus-runtime-user-info");
    if (!cachedUser || cachedUser === "null") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">Validando acesso...</p>
          </div>
        </div>
      );
    }
  }

  // Se não estiver autenticado após o carregamento
  if (!isAuthenticated && !loading) {
    const publicPages = ["/", "/login", "/register", "/forgot-password", "/pricing", "/landing"];
    
    if (!publicPages.includes(location)) {
      // Verificamos se há cache antes de redirecionar, para evitar redirecionamentos intermitentes
      const cachedUser = localStorage.getItem("manus-runtime-user-info");
      if (!cachedUser || cachedUser === "null") {
        console.log("[AppLayout] Sem autenticação e sem cache, redirecionando para login...");
        window.location.href = "/login";
        return null;
      }
      // Se houver cache, permitimos que o layout renderize enquanto a query 'me' tenta novamente ou o usuário decide o que fazer
      console.log("[AppLayout] Sem autenticação mas com cache, mantendo no dashboard...");
    }
  }

  // Se estiver em uma página pública (como login) e já estiver autenticado, redireciona para o dashboard
  if (isAuthenticated && (location === "/login" || location === "/register")) {
    window.location.href = "/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:opacity-80 transition-opacity">
              <Sparkles className="w-6 h-6 text-primary" />
              <span>MKT Gerenciador</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground truncate">{user?.email}</p>
            <p className="text-sm font-bold truncate">{user?.name}</p>
          </div>
          <button 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isLoading}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
