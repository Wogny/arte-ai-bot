import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, Image as ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Gallery() {
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: images, isLoading } = trpc.images.list.useQuery({ 
    projectId: selectedProject 
  });

  const getStyleColor = (style: string) => {
    const colors: Record<string, string> = {
      minimalista: "bg-slate-100 text-slate-700 border-slate-300",
      colorido: "bg-pink-100 text-pink-700 border-pink-300",
      corporativo: "bg-blue-100 text-blue-700 border-blue-300",
      artistico: "bg-purple-100 text-purple-700 border-purple-300",
      moderno: "bg-emerald-100 text-emerald-700 border-emerald-300",
    };
    return colors[style] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      post: "Post",
      story: "Story",
      banner: "Banner",
      anuncio: "Anúncio",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Galeria de Artes</h1>
              <p className="text-muted-foreground text-lg">
                Todas as suas criações em um só lugar
              </p>
            </div>
            <div className="w-64">
              <Select 
                value={selectedProject?.toString()} 
                onValueChange={(val) => setSelectedProject(val ? Number(val) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-xl transition-shadow border-2">
                <CardHeader className="p-0">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {(() => {
                      const src = image.imageUrl;
                      const isValid = src && (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:'));
                      if (!isValid) return <div className="w-full h-full flex items-center justify-center bg-muted"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>;
                      return (
                        <img 
                          src={src} 
                          alt={image.prompt}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className={getStyleColor(image.visualStyle)}>
                      {image.visualStyle}
                    </Badge>
                    <Badge variant="secondary">
                      {getTypeLabel(image.contentType)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(image.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={image.imageUrl} download>
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Agendar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma arte criada ainda</h3>
              <p className="text-muted-foreground text-center mb-6">
                Comece criando sua primeira arte com IA
              </p>
              <Button>Criar Nova Arte</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
