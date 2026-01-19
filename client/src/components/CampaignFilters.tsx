import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { format, subDays } from "date-fns";

export interface CampaignFilterState {
  searchText: string;
  tags: number[];
  platforms: string[];
  dateRange: "all" | "7days" | "30days" | "90days";
  performanceLevel: "all" | "low" | "medium" | "high";
}

interface CampaignFiltersProps {
  onFilterChange: (filters: CampaignFilterState) => void;
  initialFilters?: CampaignFilterState;
}

const DEFAULT_FILTERS: CampaignFilterState = {
  searchText: "",
  tags: [],
  platforms: [],
  dateRange: "all",
  performanceLevel: "all",
};

const PLATFORMS = ["Facebook", "Instagram", "Facebook + Instagram", "Google Ads", "TikTok"];

export default function CampaignFilters({ onFilterChange, initialFilters }: CampaignFiltersProps) {
  const [filters, setFilters] = useState<CampaignFilterState>(initialFilters || DEFAULT_FILTERS);
  const [isOpen, setIsOpen] = useState(false);

  const tagsQuery = trpc.tags.list.useQuery();

  const handleFilterChange = (newFilters: CampaignFilterState) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (text: string) => {
    handleFilterChange({ ...filters, searchText: text });
  };

  const handleTagToggle = (tagId: number) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId];
    handleFilterChange({ ...filters, tags: newTags });
  };

  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    handleFilterChange({ ...filters, platforms: newPlatforms });
  };

  const handleResetFilters = () => {
    handleFilterChange(DEFAULT_FILTERS);
  };

  const activeFilterCount = 
    (filters.searchText ? 1 : 0) +
    filters.tags.length +
    filters.platforms.length +
    (filters.dateRange !== "all" ? 1 : 0) +
    (filters.performanceLevel !== "all" ? 1 : 0);

  const selectedTags = tagsQuery.data?.filter(t => filters.tags.includes(t.id)) || [];

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <Input
        placeholder="Buscar campanhas..."
        value={filters.searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full"
      />

      {/* Filter Button and Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              {/* Tags Filter */}
              <div>
                <Label className="font-semibold mb-2 block">Tags</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tagsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando tags...</p>
                  ) : tagsQuery.data && tagsQuery.data.length > 0 ? (
                    tagsQuery.data.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={filters.tags.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm">{tag.name}</span>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma tag criada</p>
                  )}
                </div>
              </div>

              {/* Platforms Filter */}
              <div>
                <Label className="font-semibold mb-2 block">Plataformas</Label>
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => (
                    <div key={platform} className="flex items-center gap-2">
                      <Checkbox
                        id={`platform-${platform}`}
                        checked={filters.platforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <label
                        htmlFor={`platform-${platform}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label htmlFor="date-range" className="font-semibold mb-2 block">
                  Período
                </Label>
                <Select value={filters.dateRange} onValueChange={(value) => 
                  handleFilterChange({ ...filters, dateRange: value as any })
                }>
                  <SelectTrigger id="date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Performance Filter */}
              <div>
                <Label htmlFor="performance" className="font-semibold mb-2 block">
                  Performance
                </Label>
                <Select value={filters.performanceLevel} onValueChange={(value) => 
                  handleFilterChange({ ...filters, performanceLevel: value as any })
                }>
                  <SelectTrigger id="performance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleResetFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white cursor-pointer hover:opacity-80"
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.name}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {filters.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.platforms.map((platform) => (
              <Badge
                key={platform}
                variant="secondary"
                className="cursor-pointer hover:opacity-80"
                onClick={() => handlePlatformToggle(platform)}
              >
                {platform}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
