import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X } from "lucide-react";

interface PlatformPreviewProps {
  platform: {
    id: string;
    name: string;
    format: string;
    imageSize: { width: number; height: number };
  };
  content: {
    text: string;
    hashtags: string[];
    imageUrl?: string;
    bestPostingTime: string;
    characterCount: number;
    estimatedReach: number;
  };
  isEditing: boolean;
  onEdit: (platform: string) => void;
  onSave: (platform: string, text: string, hashtags: string[]) => void;
  onCancel: (platform: string) => void;
  onApprove: (platform: string) => void;
  isApproved: boolean;
}

export default function PlatformPreview({
  platform,
  content,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onApprove,
  isApproved,
}: PlatformPreviewProps) {
  const [editedText, setEditedText] = React.useState(content.text);
  const [editedHashtags, setEditedHashtags] = React.useState(content.hashtags.join(" "));

  const handleSave = () => {
    onSave(
      platform.id,
      editedText,
      editedHashtags
        .split(" ")
        .filter((h) => h.trim().length > 0)
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
    );
  };

  return (
    <Card className={`relative overflow-hidden ${isApproved ? "border-green-500 bg-green-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{platform.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {platform.format}
            </Badge>
          </div>
          {isApproved && (
            <Badge className="bg-green-500">
              <Check className="mr-1 h-3 w-3" />
              Aprovado
            </Badge>
          )}
        </div>
        <CardDescription>
          {platform.imageSize.width}x{platform.imageSize.height}px • Alcance estimado: {content.estimatedReach.toLocaleString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview de Imagem */}
        {content.imageUrl && (
          <div className="overflow-hidden rounded-lg bg-gray-100">
            <img
              src={content.imageUrl}
              alt={`Preview ${platform.name}`}
              className="h-auto w-full object-cover"
              style={{
                maxHeight: "300px",
              }}
            />
          </div>
        )}

        {/* Texto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Texto</label>
            <span className="text-xs text-gray-500">
              {editedText.length} caracteres
            </span>
          </div>
          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-24 resize-none"
              placeholder="Edite o texto..."
            />
          ) : (
            <div className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed">
              {content.text}
            </div>
          )}
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Hashtags</label>
          {isEditing ? (
            <Textarea
              value={editedHashtags}
              onChange={(e) => setEditedHashtags(e.target.value)}
              className="min-h-16 resize-none"
              placeholder="Edite as hashtags (separadas por espaço)..."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Melhor Horário */}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <span className="text-sm text-gray-600">Melhor horário para postar:</span>
          <span className="font-semibold text-blue-600">{content.bestPostingTime}</span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSave}
              >
                <Check className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onCancel(platform.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(platform.id)}
                disabled={isApproved}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                size="sm"
                className={`flex-1 ${
                  isApproved
                    ? "bg-gray-400 hover:bg-gray-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={() => onApprove(platform.id)}
              >
                <Check className="mr-2 h-4 w-4" />
                {isApproved ? "Aprovado" : "Aprovar"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
