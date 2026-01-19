import React, { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Zap, Video, Film, Smartphone, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Post {
  id: number;
  title: string;
  content?: string;
  platforms: ("facebook" | "instagram" | "tiktok" | "whatsapp")[];
  scheduledAt: Date;
  status: "scheduled" | "published" | "failed";
  imageUrl?: string;
  // Campos de vídeo
  mediaType?: "image" | "video" | "gif" | "carousel";
  contentFormat?: "post" | "story" | "reel" | "carousel";
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

interface VisualCalendarProps {
  posts: Post[];
  onDateClick?: (date: Date) => void;
  onPostClick?: (post: Post) => void;
  onPostDragEnd?: (postId: number, newDate: Date) => void;
  isLoading?: boolean;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  facebook: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" },
  instagram: { bg: "bg-pink-50", text: "text-pink-700", badge: "bg-pink-100" },
  tiktok: { bg: "bg-black/5", text: "text-black", badge: "bg-black/10" },
  whatsapp: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100" },
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function VisualCalendar({
  posts,
  onDateClick,
  onPostClick,
  onPostDragEnd,
  isLoading = false,
}: VisualCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    posts.forEach((post) => {
      const dateKey = format(post.scheduledAt, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    });
    return grouped;
  }, [posts]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDragStart = (e: React.DragEvent, post: Post) => {
    setDraggedPost(post);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedPost && onPostDragEnd) {
      const newDate = new Date(date);
      newDate.setHours(draggedPost.scheduledAt.getHours());
      newDate.setMinutes(draggedPost.scheduledAt.getMinutes());
      onPostDragEnd(draggedPost.id, newDate);
    }
    setDraggedPost(null);
  };

  const handleDragEnd = () => {
    setDraggedPost(null);
  };

  const getPostsForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return postsByDate[dateKey] || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Calendário de Posts</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-48 text-center font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((date) => {
              const postsForDay = getPostsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={date.toISOString()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, date)}
                  onClick={() => onDateClick?.(date)}
                  className={`
                    min-h-32 p-2 border rounded-lg cursor-pointer transition-all
                    ${isCurrentMonth ? "bg-background" : "bg-muted/30"}
                    ${isToday ? "border-primary border-2 bg-primary/5" : "border-border"}
                    ${draggedPost ? "hover:bg-primary/10" : "hover:bg-muted/50"}
                  `}
                >
                  {/* Date number */}
                  <div className={`text-sm font-semibold mb-1 ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                    {format(date, "d")}
                  </div>

                  {/* Posts for this day */}
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {postsForDay.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick?.(post);
                        }}
                        className={`
                          p-1.5 rounded text-xs cursor-grab active:cursor-grabbing
                          transition-all hover:shadow-md
                          ${PLATFORM_COLORS[post.platforms[0]]?.bg || "bg-gray-100"}
                          ${PLATFORM_COLORS[post.platforms[0]]?.text || "text-gray-700"}
                        `}
                      >
                        <div className="flex items-center gap-1">
                          {post.mediaType === "video" && <Video className="w-3 h-3" />}
                          {post.contentFormat === "reel" && <Film className="w-3 h-3" />}
                          {post.contentFormat === "story" && <Smartphone className="w-3 h-3" />}
                          <span className="font-semibold truncate">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-xs">{format(post.scheduledAt, "HH:mm")}</span>
                          {post.duration && (
                            <span className="text-xs ml-1">({Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, "0")})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Post count indicator */}
                  {postsForDay.length > 0 && (
                    <div className="mt-1 pt-1 border-t text-xs text-muted-foreground">
                      {postsForDay.length} post{postsForDay.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Posts Agendados</CardTitle>
            <CardDescription>Total de {posts.length} posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onPostClick?.(post)}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Thumbnail/Preview */}
                    {(post.thumbnailUrl || post.imageUrl) && (
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={post.thumbnailUrl || post.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {post.mediaType === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {post.mediaType === "video" && <Video className="w-4 h-4 text-primary" />}
                        {post.contentFormat === "reel" && <Film className="w-4 h-4 text-pink-500" />}
                        {post.contentFormat === "story" && <Smartphone className="w-4 h-4 text-purple-500" />}
                        <h4 className="font-semibold truncate">{post.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(post.scheduledAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.platforms.map((platform) => (
                          <Badge
                            key={platform}
                            variant="secondary"
                            className={PLATFORM_COLORS[platform]?.badge}
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[post.status]}>
                      {post.status === "scheduled" && <Zap className="w-3 h-3 mr-1" />}
                      {post.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {posts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum post agendado para este mês</p>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro post para começar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
