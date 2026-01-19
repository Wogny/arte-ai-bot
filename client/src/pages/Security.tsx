import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield,
  Key,
  Smartphone,
  History,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Monitor,
  Clock,
  Download,
  Trash2,
  FileText,
  Loader2,
  Copy,
  RefreshCw,
} from "lucide-react";

// Mock audit logs
const auditLogs = [
  { id: 1, action: "Login realizado", ip: "189.45.123.xxx", device: "Chrome / Windows", location: "São Paulo, BR", timestamp: new Date(Date.now() - 5 * 60 * 1000), status: "success" },
  { id: 2, action: "Imagem gerada", ip: "189.45.123.xxx", device: "Chrome / Windows", location: "São Paulo, BR", timestamp: new Date(Date.now() - 30 * 60 * 1000), status: "success" },
  { id: 3, action: "Post agendado", ip: "189.45.123.xxx", device: "Safari / iOS", location: "São Paulo, BR", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: "success" },
  { id: 4, action: "Tentativa de login", ip: "45.67.89.xxx", device: "Firefox / Linux", location: "Moscou, RU", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), status: "failed" },
  { id: 5, action: "Senha alterada", ip: "189.45.123.xxx", device: "Chrome / Windows", location: "São Paulo, BR", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), status: "success" },
  { id: 6, action: "2FA ativado", ip: "189.45.123.xxx", device: "Chrome / Windows", location: "São Paulo, BR", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), status: "success" },
];

// Mock active sessions
const activeSessions = [
  { id: 1, device: "Chrome / Windows 11", location: "São Paulo, BR", ip: "189.45.123.xxx", lastActive: new Date(), current: true },
  { id: 2, device: "Safari / iPhone 15", location: "São Paulo, BR", ip: "189.45.124.xxx", lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), current: false },
  { id: 3, device: "Firefox / macOS", location: "Rio de Janeiro, BR", ip: "200.12.34.xxx", lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), current: false },
];

export default function Security() {
  const [activeTab, setActiveTab] = useState("overview");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: true,
    marketingEmails: false,
    activityTracking: true,
    dataExport: false,
  });

  const backupCodes = ["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6", "Q7R8-S9T0"];

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTwoFactorEnabled(true);
    setShowSetup2FA(false);
    setShowBackupCodes(true);
    toast.success("2FA ativado com sucesso!");
    setIsVerifying(false);
  };

  const handleDisable2FA = () => {
    setTwoFactorEnabled(false);
    toast.success("2FA desativado");
  };

  const handleRevokeSession = (sessionId: number) => {
    toast.success("Sessão encerrada com sucesso");
  };

  const handleExportData = () => {
    toast.success("Exportação iniciada. Você receberá um email quando estiver pronta.");
  };

  const handleDeleteAccount = () => {
    toast.error("Funcionalidade em desenvolvimento");
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Agora";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h atrás`;
    return `${Math.floor(seconds / 86400)} dias atrás`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            Segurança & Privacidade
          </h1>
          <p className="text-gray-400 mt-1">Gerencie a segurança da sua conta e configurações de privacidade</p>
        </div>

        {/* Security Score */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${twoFactorEnabled ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {twoFactorEnabled ? "A" : "B"}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Nível de Segurança: {twoFactorEnabled ? "Alto" : "Médio"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {twoFactorEnabled 
                      ? "Sua conta está bem protegida com 2FA ativado" 
                      : "Ative a autenticação em dois fatores para maior segurança"}
                  </p>
                </div>
              </div>
              {!twoFactorEnabled && (
                <Button onClick={() => setShowSetup2FA(true)} className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Shield className="w-4 h-4 mr-2" />
                  Melhorar Segurança
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20">
              <Shield className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-cyan-500/20">
              <Monitor className="w-4 h-4 mr-2" />
              Sessões Ativas
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-cyan-500/20">
              <History className="w-4 h-4 mr-2" />
              Logs de Auditoria
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-cyan-500/20">
              <Lock className="w-4 h-4 mr-2" />
              Privacidade
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* 2FA Card */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    Autenticação em Dois Fatores (2FA)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Adicione uma camada extra de segurança à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {twoFactorEnabled ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Desativado
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setShowSetup2FA(true);
                        } else {
                          handleDisable2FA();
                        }
                      }}
                    />
                  </div>
                  {twoFactorEnabled && (
                    <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(true)}>
                      <Key className="w-4 h-4 mr-2" />
                      Ver Códigos de Backup
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Password Card */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    Senha
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Última alteração há 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Forte
                    </Badge>
                    <span className="text-gray-400 text-sm">••••••••••••</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white text-sm">{log.action}</p>
                          <p className="text-gray-500 text-xs">{log.device} • {log.location}</p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">{formatTimeAgo(log.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Sessões Ativas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Dispositivos conectados à sua conta
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-red-400 border-red-400/50 hover:bg-red-500/10">
                  Encerrar Todas
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${session.current ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{session.device}</p>
                          {session.current && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Atual</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.location}
                          </span>
                          <span>{session.ip}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(session.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="mt-6 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Logs de Auditoria</CardTitle>
                  <CardDescription className="text-gray-400">
                    Histórico de atividades da sua conta
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{log.action}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{log.device}</span>
                            <span>{log.ip}</span>
                            <span>{log.location}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs whitespace-nowrap">
                        {log.timestamp.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-6 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Configurações de Privacidade</CardTitle>
                <CardDescription className="text-gray-400">
                  Controle como seus dados são usados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Compartilhar dados de analytics</p>
                    <p className="text-gray-400 text-sm">Ajude-nos a melhorar o produto</p>
                  </div>
                  <Switch
                    checked={privacySettings.shareAnalytics}
                    onCheckedChange={(v) => setPrivacySettings({ ...privacySettings, shareAnalytics: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Emails de marketing</p>
                    <p className="text-gray-400 text-sm">Receba novidades e promoções</p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingEmails}
                    onCheckedChange={(v) => setPrivacySettings({ ...privacySettings, marketingEmails: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Rastreamento de atividade</p>
                    <p className="text-gray-400 text-sm">Registrar ações para segurança</p>
                  </div>
                  <Switch
                    checked={privacySettings.activityTracking}
                    onCheckedChange={(v) => setPrivacySettings({ ...privacySettings, activityTracking: v })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* LGPD Actions */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Seus Dados (LGPD)</CardTitle>
                <CardDescription className="text-gray-400">
                  Exerça seus direitos conforme a Lei Geral de Proteção de Dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Exportar meus dados</p>
                      <p className="text-gray-400 text-sm">Baixe uma cópia de todos os seus dados</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    Solicitar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-white font-medium">Excluir minha conta</p>
                      <p className="text-gray-400 text-sm">Remova permanentemente todos os seus dados</p>
                    </div>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Legal Links */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Documentos Legais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Termos de Uso
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Política de Privacidade
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Política de Cookies
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 2FA Setup Dialog */}
        <Dialog open={showSetup2FA} onOpenChange={setShowSetup2FA}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Configurar 2FA</DialogTitle>
              <DialogDescription className="text-gray-400">
                Escaneie o QR code com seu app autenticador
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">QR Code</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Código de verificação</label>
                <Input
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetup2FA(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEnable2FA} disabled={isVerifying}>
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Ativar 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Códigos de Backup</DialogTitle>
              <DialogDescription className="text-gray-400">
                Guarde esses códigos em um local seguro. Cada código só pode ser usado uma vez.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 font-mono">
                    <span className="text-white">{code}</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success("Código copiado!");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowBackupCodes(false)}>
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
