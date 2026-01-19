import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sparkles, 
  Image, 
  FolderOpen, 
  Calendar, 
  Settings, 
  BarChart3,
  Lightbulb,
  LogOut,
  Wand2,
  Plug,
  Share2,
  Upload,
  LineChart,
  Lock,
  HelpCircle,
  Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/create", label: "Criar Arte", icon: Sparkles },
  { href: "/gallery", label: "Galeria", icon: Image },
  { href: "/media-upload", label: "Upload de Mídia", icon: Upload },
  { href: "/projects", label: "Projetos", icon: FolderOpen },
  { href: "/platforms", label: "Central de Plataformas", icon: Share2 },
  { href: "/batch-adaptation", label: "Adaptação em Lote", icon: Wand2 },
  { href: "/calendar", label: "Calendário de Posts", icon: Calendar },
  { href: "/real-time-analytics", label: "Analytics em Tempo Real", icon: BarChart3 },
  { href: "/competitor-analysis", label: "Análise de Concorrentes", icon: BarChart3 },
  { href: "/centralized-scheduling", label: "Agendamento Central", icon: Calendar },
  { href: "/platform-connections", label: "Conexões", icon: Plug },
  { href: "/campaigns", label: "Campanhas", icon: BarChart3 },
  { href: "/recommendations", label: "Recomendações", icon: Lightbulb },
  { href: "/meta-settings", label: "Integração Meta", icon: Settings },
  { href: "/analytics", label: "Analytics Avançado", icon: LineChart },
  { href: "/support-center", label: "Central de Ajuda", icon: HelpCircle },
  { href: "/security", label: "Segurança", icon: Lock },
  { href: "/admin", label: "Painel Admin", icon: Users },
  { href: "/execution-monitor", label: "Monitor Execução", icon: BarChart3 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [devLoginAvailable, setDevLoginAvailable] = useState(false);
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado com sucesso!");
      window.location.href = "/";
    },
  });

  // Verifica se login de desenvolvimento está disponível
  useEffect(() => {
    fetch("/api/dev/status")
      .then(res => res.json())
      .then(data => {
        setDevLoginAvailable(data.devLoginAvailable);
      })
      .catch(() => {
        setDevLoginAvailable(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">MKT Gerenciador</h1>
            <p className="text-muted-foreground">
              Crie conteúdo visual incrível com inteligência artificial
            </p>
          </div>
          {devLoginAvailable ? (
            <Button size="lg" className="w-full" asChild>
              <a href="/api/dev/login">Entrar (Modo Desenvolvimento)</a>
            </Button>
          ) : (
            <Button size="lg" className="w-full" asChild>
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
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
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
