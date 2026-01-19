import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

interface CampaignCSVUploadProps {
  onSuccess?: () => void;
}

export default function CampaignCSVUpload({ onSuccess }: CampaignCSVUploadProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const utils = trpc.useUtils();
  const downloadTemplate = trpc.campaigns.downloadTemplate.useQuery();
  const importMutation = trpc.campaigns.importCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.imported} campanhas importadas com sucesso!`);
      utils.campaigns.list.invalidate();
      setFile(null);
      setPreview("");
      setDialogOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao importar: " + error.message);
    },
  });

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setFile(selectedFile);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split("\n").slice(0, 6); // Show first 5 rows + header
      setPreview(lines.join("\n"));
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importMutation.mutate({ csvContent: content });
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    if (!downloadTemplate.data) return;

    const element = document.createElement("a");
    const file = new Blob([downloadTemplate.data.template], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = "campanhas_template.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Template baixado com sucesso!");
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Campanhas via CSV</DialogTitle>
          <DialogDescription>
            Importe múltiplas campanhas de uma vez usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Precisa de um template?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Baixe nosso template CSV com exemplos de como formatar seus dados
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplate.isLoading}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadTemplate.isLoading ? "Carregando..." : "Baixar Template"}
                </Button>
              </div>
            </div>
          </div>

          {/* Format Requirements */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Formato esperado:</h4>
            <div className="text-sm text-amber-800 space-y-1">
              <p><strong>Colunas obrigatórias:</strong> name, platform, startDate</p>
              <p><strong>Colunas opcionais:</strong> endDate, impressions, reach, engagement, clicks, conversions, spend</p>
              <p><strong>Plataformas válidas:</strong> Facebook, Instagram, Facebook + Instagram, Google Ads, TikTok</p>
              <p><strong>Datas:</strong> Use formato YYYY-MM-DD (ex: 2024-12-30)</p>
            </div>
          </div>

          {/* File Input */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-medium mb-1">
              {file ? file.name : "Clique para selecionar um arquivo CSV"}
            </p>
            <p className="text-sm text-muted-foreground">
              ou arraste um arquivo aqui
            </p>
          </div>

          {/* File Preview */}
          {preview && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-2 text-sm">Preview (primeiras linhas):</h4>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {preview}
              </pre>
            </div>
          )}

          {/* Import Status */}
          {importMutation.isPending && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertTitle className="text-blue-900">Importando...</AlertTitle>
              <AlertDescription className="text-blue-800">
                Processando seu arquivo CSV. Isso pode levar alguns segundos.
              </AlertDescription>
            </Alert>
          )}

          {importMutation.isSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Sucesso!</AlertTitle>
              <AlertDescription className="text-green-800">
                {importMutation.data?.imported} campanhas foram importadas com sucesso.
              </AlertDescription>
            </Alert>
          )}

          {importMutation.isError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Erro na importação</AlertTitle>
              <AlertDescription className="text-red-800">
                {importMutation.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setPreview("");
              setDialogOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar Campanhas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
