import React, { useState } from "react";
import { MessageSquare, CheckCircle, XCircle, Clock, Send, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export default function PostDetailPage() {
  const [comment, setComment] = useState("");
  const workspaceId = 1;
  const postId = 1; // Simulado

  const comments = trpc.collaboration.listComments.useQuery({ workspaceId, postId });
  const versions = trpc.collaboration.listVersions.useQuery({ workspaceId, postId });
  
  const addComment = trpc.collaboration.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      comments.refetch();
    },
  });

  const approvePost = trpc.collaboration.approvePost.useMutation({
    onSuccess: () => alert("Ação realizada com sucesso!"),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Visualização do Post */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Visualização do Post</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aprovação Pendente</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
              <span className="text-gray-400">Imagem do Post</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700">
                "Confira as novidades da nossa coleção de verão! ☀️ #Moda #Verão2026"
              </p>
            </div>
            
            <div className="flex gap-4 pt-4 border-t">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => approvePost.mutate({ workspaceId, postId, approved: true })}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar Post
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => approvePost.mutate({ workspaceId, postId, approved: false, feedback: "Ajustar a legenda." })}
              >
                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Versões */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de Versões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.data?.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{v.versionNumber}</Badge>
                    <span className="text-sm font-medium">Editado por {v.userName}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {!versions.data?.length && <p className="text-sm text-gray-500 text-center py-4">Nenhuma versão anterior.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colaboração e Comentários */}
      <div className="space-y-6">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Comentários da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4">
            <div className="flex-grow overflow-y-auto space-y-4 max-h-[500px] pr-2">
              {comments.data?.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary">{c.userName}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg text-sm">
                    {c.content}
                  </div>
                </div>
              ))}
              {!comments.data?.length && <p className="text-sm text-gray-500 text-center py-8">Nenhum comentário ainda.</p>}
            </div>

            <div className="pt-4 border-t space-y-2">
              <Textarea 
                placeholder="Escreva um comentário..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                className="w-full" 
                onClick={() => addComment.mutate({ workspaceId, postId, content: comment })}
                disabled={!comment.trim() || addComment.isPending}
              >
                <Send className="mr-2 h-4 w-4" /> Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
