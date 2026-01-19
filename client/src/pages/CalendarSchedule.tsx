import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import VisualCalendar from "@/components/VisualCalendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Edit2, Trash2, Save, X, Video, Film, Smartphone, Square, Play } from "lucide-react";
import { format } from "date-fns";
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

const PLATFORMS = [
  { id: "facebook", name: "Facebook", color: "bg-blue-600" },
  { id: "instagram", name: "Instagram", color: "bg-pink-600" },
  { id: "tiktok", name: "TikTok", color: "bg-black" },
  { id: "whatsapp", name: "WhatsApp", color: "bg-green-600" },
];

export default function CalendarSchedule() {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Post>>({});

  // Fetch scheduled posts
  const postsQuery = trpc.multiplatform.list.useQuery({
    status: "scheduled",
    limit: 100,
  });

  // Update post mutation
  const updatePostMutation = trpc.multiplatform.update.useMutation({
    onSuccess: () => {
      toast.success("Post atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedPost(null);
      postsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar post");
    },
  });

  // Delete post mutation
  const deletePostMutation = trpc.multiplatform.delete.useMutation({
    onSuccess: () => {
      toast.success("Post cancelado com sucesso!");
      setSelectedPost(null);
      postsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar post");
    },
  });

  // Transform posts to match VisualCalendar interface
  const calendarPosts: Post[] = (postsQuery.data || []).map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    platforms: (post.platforms || []) as ("facebook" | "instagram" | "tiktok" | "whatsapp")[],
    scheduledAt: new Date(post.scheduledAt),
    status: post.status || "scheduled",
    imageUrl: post.imageUrl,
    // Campos de vídeo
    mediaType: post.mediaType || "image",
    contentFormat: post.contentFormat || "post",
    videoUrl: post.videoUrl,
    thumbnailUrl: post.thumbnailUrl,
    duration: post.duration,
  }));

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setEditFormData(post);
    setIsEditDialogOpen(true);
  };

  const handlePostDragEnd = (postId: number, newDate: Date) => {
    const post = calendarPosts.find((p) => p.id === postId);
    if (post) {
      updatePostMutation.mutate({
        id: postId,
        scheduledAt: newDate,
        platforms: post.platforms,
      });
      toast.success("Post reagendado com sucesso!");
    }
  };

  const handleSaveChanges = () => {
    if (!selectedPost) return;

    updatePostMutation.mutate({
      id: selectedPost.id,
      title: editFormData.title,
      content: editFormData.content,
      platforms: editFormData.platforms,
      scheduledAt: editFormData.scheduledAt,
    });
  };

  const handleDeletePost = () => {
    if (!selectedPost) return;

    if (confirm("Tem certeza que deseja cancelar este post?")) {
      deletePostMutation.mutate({ id: selectedPost.id });
    }
  };

  const handlePlatformToggle = (platform: "facebook" | "instagram" | "tiktok" | "whatsapp") => {
    setEditFormData((prev) => ({
      ...prev,
      platforms: prev.platforms?.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...(prev.platforms || []), platform],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Calendário de Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e reorganize seus posts agendados de forma intuitiva
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{calendarPosts.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Posts Agendados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {calendarPosts.filter((p) => p.status === "published").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Publicados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {calendarPosts.filter((p) => p.status === "scheduled").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <VisualCalendar
        posts={calendarPosts}
        onPostClick={handlePostClick}
        onPostDragEnd={handlePostDragEnd}
        isLoading={postsQuery.isLoading}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Post</DialogTitle>
            <DialogDescription>
              Modifique os detalhes do seu post agendado
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editFormData.title || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Título do post"
                  className="mt-1"
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={editFormData.content || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Conteúdo do post"
                  className="mt-1 min-h-32"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={
                      editFormData.scheduledAt
                        ? format(editFormData.scheduledAt, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (editFormData.scheduledAt) {
                        date.setHours(editFormData.scheduledAt.getHours());
                        date.setMinutes(editFormData.scheduledAt.getMinutes());
                      }
                      setEditFormData((prev) => ({ ...prev, scheduledAt: date }));
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={
                      editFormData.scheduledAt
                        ? format(editFormData.scheduledAt, "HH:mm")
                        : ""
                    }
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      if (editFormData.scheduledAt) {
                        const date = new Date(editFormData.scheduledAt);
                        date.setHours(parseInt(hours), parseInt(minutes));
                        setEditFormData((prev) => ({ ...prev, scheduledAt: date }));
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <Label>Plataformas</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {PLATFORMS.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={editFormData.platforms?.includes(platform.id as "facebook" | "instagram" | "tiktok" | "whatsapp") || false}
                        onCheckedChange={() => handlePlatformToggle(platform.id as "facebook" | "instagram" | "tiktok" | "whatsapp")}
                      />
                      <label
                        htmlFor={platform.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {platform.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <div className="mt-2">
                  <Badge
                    className={
                      selectedPost.status === "scheduled"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedPost.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedPost.status}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updatePostMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePost}
                  disabled={updatePostMutation.isPending || deletePostMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={updatePostMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
