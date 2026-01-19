import React, { useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertTriangle,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Configuração do localizador para português
const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Cores por plataforma
const platformColors: Record<string, { bg: string; border: string; text: string }> = {
  instagram: { bg: "bg-gradient-to-r from-purple-500 to-pink-500", border: "border-purple-500", text: "text-white" },
  facebook: { bg: "bg-blue-600", border: "border-blue-600", text: "text-white" },
  tiktok: { bg: "bg-black", border: "border-black", text: "text-white" },
  whatsapp: { bg: "bg-green-500", border: "border-green-500", text: "text-white" },
  twitter: { bg: "bg-sky-500", border: "border-sky-500", text: "text-white" },
};

// Cores por status
const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "bg-blue-100", text: "text-blue-700" },
  published: { bg: "bg-green-100", text: "text-green-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  pending_approval: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

// Ícones por plataforma
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "whatsapp":
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <CalendarIcon className="h-4 w-4" />;
  }
};

// Tipo para eventos do calendário
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  platform: string;
  status: string;
  caption?: string;
  imageUrl?: string | null;
}

// Componente de evento customizado
const EventComponent = ({ event }: { event: CalendarEvent }) => {
  const colors = platformColors[event.platform.toLowerCase()] || platformColors.instagram;
  const statusColor = statusColors[event.status] || statusColors.scheduled;

  return (
    <div className={`${colors.bg} ${colors.text} rounded-md p-1 text-xs overflow-hidden h-full`}>
      <div className="flex items-center gap-1">
        <PlatformIcon platform={event.platform} />
        <span className="truncate font-medium">{event.title}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5 opacity-80">
        <Clock className="h-3 w-3" />
        <span>{format(event.start, "HH:mm")}</span>
      </div>
    </div>
  );
};

// Componente principal do Calendário
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);

  // Query para buscar posts agendados
  const { data: scheduledPosts, isLoading, refetch } = trpc.multiplatform.list.useQuery({ status: undefined, limit: 100, offset: 0 }, {
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });

  // Mutation para atualizar data/hora do post
  const updatePostMutation = trpc.multiplatform.reschedule.useMutation({
    onSuccess: () => {
      refetch();
      setShowEventDialog(false);
    },
  });

  // Converter posts para eventos do calendário
  const events: CalendarEvent[] = useMemo(() => {
    if (!scheduledPosts) return [];
    
    return scheduledPosts.map((post) => ({
      id: post.id,
      title: post.content?.slice(0, 30) || post.title || `Post #${post.id}`,
      start: new Date(post.scheduledAt),
      end: addHours(new Date(post.scheduledAt), 1),
      platform: post.platforms?.[0] || 'instagram',
      status: post.status,
      caption: post.content,
      imageUrl: post.imageUrl,
    }));
  }, [scheduledPosts]);

  // Detectar conflitos (posts no mesmo horário)
  const detectConflicts = useCallback((date: Date) => {
    const conflictingEvents = events.filter((event) => {
      const eventTime = event.start.getTime();
      const targetTime = date.getTime();
      const oneHour = 60 * 60 * 1000;
      return Math.abs(eventTime - targetTime) < oneHour && event.platform === selectedEvent?.platform;
    });
    setConflicts(conflictingEvents);
    return conflictingEvents.length > 0;
  }, [events, selectedEvent]);

  // Sugestão de melhor horário
  const suggestBestTime = useCallback((date: Date): Date => {
    const suggestedHours = [9, 12, 18, 20]; // Horários de pico comuns
    const dayEvents = events.filter((e) => isSameDay(e.start, date));
    
    for (const hour of suggestedHours) {
      const suggestedTime = new Date(date);
      suggestedTime.setHours(hour, 0, 0, 0);
      
      const hasConflict = dayEvents.some((e) => {
        const diff = Math.abs(e.start.getTime() - suggestedTime.getTime());
        return diff < 60 * 60 * 1000; // 1 hora de diferença
      });
      
      if (!hasConflict) return suggestedTime;
    }
    
    return date;
  }, [events]);

  // Handler para clicar em um evento
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Handler para selecionar um slot vazio
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setShowNewPostDialog(true);
  };

  // Handler para drag-and-drop (reagendar)
  const handleEventDrop = ({ event, start }: { event: CalendarEvent; start: Date }) => {
    if (detectConflicts(start)) {
      // Mostrar aviso de conflito
      return;
    }
    
    updatePostMutation.mutate({
      postId: event.id,
      newDate: start.toISOString(),
    });
  };

  // Navegação do calendário
  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    const newDate = new Date(currentDate);
    if (action === "PREV") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (action === "NEXT") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      return setCurrentDate(new Date());
    }
    setCurrentDate(newDate);
  };

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const monthEvents = events.filter((e) => 
      e.start.getMonth() === currentDate.getMonth() &&
      e.start.getFullYear() === currentDate.getFullYear()
    );
    
    return {
      total: monthEvents.length,
      scheduled: monthEvents.filter((e) => e.status === "scheduled").length,
      published: monthEvents.filter((e) => e.status === "published").length,
      failed: monthEvents.filter((e) => e.status === "failed").length,
      byPlatform: {
        instagram: monthEvents.filter((e) => e.platform.toLowerCase() === "instagram").length,
        facebook: monthEvents.filter((e) => e.platform.toLowerCase() === "facebook").length,
        tiktok: monthEvents.filter((e) => e.platform.toLowerCase() === "tiktok").length,
        whatsapp: monthEvents.filter((e) => e.platform.toLowerCase() === "whatsapp").length,
      },
    };
  }, [events, currentDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-purple-400" />
              Calendário de Publicações
            </h1>
            <p className="text-gray-400 mt-1">
              Gerencie todos os seus posts em um só lugar
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
              onClick={() => setShowNewPostDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Post
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com estatísticas */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats Card */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{monthStats.scheduled}</p>
                  <p className="text-xs text-gray-400">Agendados</p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{monthStats.published}</p>
                  <p className="text-xs text-gray-400">Publicados</p>
                </div>
              </div>
              
              {monthStats.failed > 0 && (
                <div className="bg-red-500/20 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-semibold">{monthStats.failed} falhas</p>
                    <p className="text-xs text-gray-400">Requerem atenção</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Por Plataforma */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Por Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(monthStats.byPlatform).map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${platformColors[platform]?.bg || "bg-gray-500"}`}>
                      <PlatformIcon platform={platform} />
                    </div>
                    <span className="text-gray-300 capitalize">{platform}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {count}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sugestão de IA */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border-purple-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm">Sugestão de IA</p>
                  <p className="text-gray-300 text-xs mt-1">
                    Seus melhores horários para postar são <strong>Terça às 18h</strong> e <strong>Quinta às 12h</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendário Principal */}
        <div className="lg:col-span-3">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 overflow-hidden">
            {/* Toolbar customizada */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleNavigate("PREV")}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleNavigate("NEXT")}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigate("TODAY")}
                  className="border-white/20 text-white hover:bg-white/10 ml-2"
                >
                  Hoje
                </Button>
              </div>
              
              <h2 className="text-xl font-bold text-white">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
              
              <div className="flex items-center gap-2">
                <Select value={view as string} onValueChange={(v) => setView(v as typeof Views[keyof typeof Views])}>
                  <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendário */}
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                </div>
              ) : (
                <div className="calendar-dark-theme">
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    view={view}
                    date={currentDate}
                    onNavigate={(date: Date) => setCurrentDate(date)}
                    onView={(newView) => setView(newView as 'month' | 'week' | 'day' | 'agenda')}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    components={{
                      event: EventComponent,
                    }}
                    messages={{
                      today: "Hoje",
                      previous: "Anterior",
                      next: "Próximo",
                      month: "Mês",
                      week: "Semana",
                      day: "Dia",
                      agenda: "Agenda",
                      noEventsInRange: "Nenhum post neste período",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Detalhes do Evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && <PlatformIcon platform={selectedEvent.platform} />}
              Detalhes do Post
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Visualize e edite as informações do post agendado
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={platformColors[selectedEvent.platform.toLowerCase()]?.bg}>
                  {selectedEvent.platform}
                </Badge>
                <Badge className={`${statusColors[selectedEvent.status]?.bg} ${statusColors[selectedEvent.status]?.text}`}>
                  {selectedEvent.status === "scheduled" ? "Agendado" : 
                   selectedEvent.status === "published" ? "Publicado" : 
                   selectedEvent.status === "failed" ? "Falhou" : selectedEvent.status}
                </Badge>
              </div>
              
              <div>
                <Label className="text-gray-400">Data e Hora</Label>
                <p className="text-white font-medium">
                  {format(selectedEvent.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              
              {selectedEvent.caption && (
                <div>
                  <Label className="text-gray-400">Legenda</Label>
                  <p className="text-white text-sm mt-1">{selectedEvent.caption}</p>
                </div>
              )}
              
              {conflicts.length > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Conflito detectado!</span>
                  </div>
                  <p className="text-yellow-300 text-sm mt-1">
                    Existe outro post agendado para um horário próximo.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEventDialog(false)} className="border-white/20 text-white">
              Fechar
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500">
              Editar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Post */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Criar Novo Post</DialogTitle>
            <DialogDescription className="text-gray-400">
              Agende um novo post para suas redes sociais
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Plataforma</Label>
              <Select>
                <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400">Data e Hora</Label>
              <Input 
                type="datetime-local" 
                className="bg-white/10 border-white/20 text-white mt-1"
                defaultValue={selectedSlot ? format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm") : ""}
              />
            </div>
            
            <div>
              <Label className="text-gray-400">Legenda</Label>
              <Textarea 
                className="bg-white/10 border-white/20 text-white mt-1" 
                placeholder="Digite a legenda do post..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewPostDialog(false)} className="border-white/20 text-white">
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Sparkles className="h-4 w-4 mr-2" /> Criar com IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Estilos customizados para o calendário */}
      <style>{`
        .calendar-dark-theme .rbc-calendar {
          background: transparent;
          color: white;
        }
        .calendar-dark-theme .rbc-header {
          background: rgba(255, 255, 255, 0.05);
          padding: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #a78bfa;
          font-weight: 600;
        }
        .calendar-dark-theme .rbc-month-view,
        .calendar-dark-theme .rbc-time-view {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .calendar-dark-theme .rbc-day-bg {
          background: rgba(255, 255, 255, 0.02);
        }
        .calendar-dark-theme .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        .calendar-dark-theme .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .calendar-dark-theme .rbc-today {
          background: rgba(139, 92, 246, 0.15);
        }
        .calendar-dark-theme .rbc-off-range-bg {
          background: rgba(0, 0, 0, 0.3);
        }
        .calendar-dark-theme .rbc-date-cell {
          padding: 5px 8px;
          color: #e2e8f0;
        }
        .calendar-dark-theme .rbc-date-cell.rbc-now {
          color: #a78bfa;
          font-weight: bold;
        }
        .calendar-dark-theme .rbc-event {
          background: transparent;
          border: none;
          padding: 0;
        }
        .calendar-dark-theme .rbc-event:focus {
          outline: none;
        }
        .calendar-dark-theme .rbc-show-more {
          color: #a78bfa;
          font-weight: 500;
        }
        .calendar-dark-theme .rbc-agenda-view {
          color: white;
        }
        .calendar-dark-theme .rbc-agenda-table {
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .calendar-dark-theme .rbc-agenda-table thead > tr > th {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #a78bfa;
        }
        .calendar-dark-theme .rbc-agenda-table tbody > tr > td {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
