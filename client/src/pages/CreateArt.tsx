import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";

const visualStyles = [
  { value: "minimalista", label: "Minimalista", description: "Design limpo e simples" },
  { value: "colorido", label: "Colorido", description: "Vibrante e chamativo" },
  { value: "corporativo", label: "Corporativo", description: "Profissional e elegante" },
  { value: "artistico", label: "Artístico", description: "Criativo e expressivo" },
  { value: "moderno", label: "Moderno", description: "Contemporâneo e sofisticado" },
];

const contentTypes = [
  { value: "post", label: "Post para Redes Sociais", description: "Formato quadrado 1:1" },
  { value: "story", label: "Story", description: "Formato vertical 9:16" },
  { value: "banner", label: "Banner", description: "Formato horizontal" },
  { value: "anuncio", label: "Anúncio", description: "Otimizado para ads" },
];

const niches = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "servicos", label: "Serviços" },
  { value: "produtos_digitais", label: "Produtos Digitais" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "moda", label: "Moda e Beleza" },
];

export default function CreateArt() {
  const { user } = useAuth();
  const [visualStyle, setVisualStyle] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | undefined>();

  const { data: projects } = trpc.projects.list.useQuery();
  const generateMutation = trpc.images.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Imagem gerada com sucesso!");
      setPrompt("");
    },
    onError: (error) => {
      toast.error("Erro ao gerar imagem: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (!visualStyle || !contentType || !prompt.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    generateMutation.mutate({
      prompt,
      style: visualStyle,
      contentType: contentType,
      projectId: selectedProject,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container py-8 max-w-5xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Criação com IA</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Crie Artes Incríveis
          </h1>
          <p className="text-muted-foreground text-lg">
            Transforme suas ideias em conteúdo visual profissional
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Configurações da Arte
                </CardTitle>
                <CardDescription>
                  Personalize o estilo e formato do seu conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="visual-style">Estilo Visual *</Label>
                  <Select value={visualStyle} onValueChange={setVisualStyle}>
                    <SelectTrigger id="visual-style">
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {visualStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-type">Tipo de Conteúdo *</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Nicho/Setor</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger id="niche">
                      <SelectValue placeholder="Selecione o nicho (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((n) => (
                        <SelectItem key={n.value} value={n.value}>
                          {n.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projeto (opcional)</Label>
                  <Select 
                    value={selectedProject?.toString()} 
                    onValueChange={(val) => setSelectedProject(val ? Number(val) : undefined)}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Descreva sua Ideia *</CardTitle>
                <CardDescription>
                  Quanto mais detalhes, melhor será o resultado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ex: Uma imagem promocional para Black Friday com descontos de até 50%, incluindo elementos de compras e cores vibrantes..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </CardContent>
            </Card>

            <Button 
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !visualStyle || !contentType || !prompt.trim()}
              className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Gerando sua arte...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Arte com IA
                </>
              )}
            </Button>

            {generateMutation.data && (
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-primary">Arte Gerada!</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={generateMutation.data.imageUrl} 
                    alt="Generated art"
                    className="w-full rounded-lg shadow-md"
                  />
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={generateMutation.data.imageUrl} download>
                        Baixar
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Agendar Postagem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
