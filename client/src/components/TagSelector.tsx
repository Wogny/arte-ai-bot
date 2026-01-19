import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface TagSelectorProps {
  campaignId: number;
  onTagsChange?: () => void;
}

export default function TagSelector({ campaignId, onTagsChange }: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [dialogOpen, setDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const tagsQuery = trpc.tags.list.useQuery();
  const campaignTagsQuery = trpc.tags.getCampaignTags.useQuery({ campaignId });

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      setNewTagName("");
      setNewTagColor("#3b82f6");
      utils.tags.list.invalidate();
      toast.success("Tag criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tag: " + error.message);
    },
  });

  const addTagMutation = trpc.tags.addToCampaign.useMutation({
    onSuccess: () => {
      utils.tags.getCampaignTags.invalidate({ campaignId });
      onTagsChange?.();
      toast.success("Tag adicionada!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar tag: " + error.message);
    },
  });

  const removeTagMutation = trpc.tags.removeFromCampaign.useMutation({
    onSuccess: () => {
      utils.tags.getCampaignTags.invalidate({ campaignId });
      onTagsChange?.();
      toast.success("Tag removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover tag: " + error.message);
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    createTagMutation.mutate({ name: newTagName, color: newTagColor });
  };

  const handleAddTag = (tagId: number) => {
    addTagMutation.mutate({ campaignId, tagId });
  };

  const handleRemoveTag = (tagId: number) => {
    removeTagMutation.mutate({ campaignId, tagId });
  };

  const campaignTagIds = new Set(campaignTagsQuery.data?.map(t => t.id) || []);
  const availableTags = tagsQuery.data?.filter(t => !campaignTagIds.has(t.id)) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <TagIcon className="w-4 h-4 mr-2" />
          Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Tags da Campanha</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {campaignTagsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : campaignTagsQuery.data && campaignTagsQuery.data.length > 0 ? (
                campaignTagsQuery.data.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    {tag.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tag adicionada</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Adicionar Tags</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAddTag(tag.id)}
                    disabled={addTagMutation.isPending}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tag disponível</p>
              )}
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tag</DialogTitle>
                <DialogDescription>
                  Crie uma tag personalizada para organizar suas campanhas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="tag-name">Nome da Tag</Label>
                  <Input
                    id="tag-name"
                    placeholder="Ex: Campanha Premium"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="tag-color">Cor</Label>
                  <div className="flex gap-2">
                    <input
                      id="tag-color"
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <div
                      className="flex-1 rounded border"
                      style={{ backgroundColor: newTagColor }}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={createTagMutation.isPending || !newTagName.trim()}
                >
                  {createTagMutation.isPending ? "Criando..." : "Criar Tag"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
