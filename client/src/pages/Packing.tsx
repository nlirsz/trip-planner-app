import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  Shirt,
  Smartphone,
  FileText,
  Heart,
  Sparkles
} from "lucide-react";

interface PackingProps {
  onNavigate: (section: string) => void;
}

interface PackingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  isCustom?: boolean;
}

export function Packing({ onNavigate }: PackingProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [newItem, setNewItem] = useState({ name: "", category: "clothing" });
  const [showAddItem, setShowAddItem] = useState(false);
  const [isGeneratingPacking, setIsGeneratingPacking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar viagens
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips"],
  });

  // Buscar dados da viagem selecionada
  const { data: selectedTripData } = useQuery({
    queryKey: ["/api/trips", selectedTrip],
    enabled: !!selectedTrip,
  });

  // Gerar lista de mala com IA
  const generatePackingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrip || !selectedTripData) return;
      
      return apiRequest("/api/packing/weather", {
        method: "POST",
        body: {
          destination: selectedTripData.destination,
          startDate: selectedTripData.startDate,
          endDate: selectedTripData.endDate,
        },
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data?.suggestions) {
        // Processar sugestões da IA e converter para formato de items
        const aiItems = parseAIPackingSuggestions(data.suggestions);
        setPackingItems(prev => [...prev, ...aiItems]);
        toast({
          title: "Lista de mala gerada!",
          description: "A IA criou uma lista personalizada com base no clima.",
        });
      }
      setIsGeneratingPacking(false);
    },
    onError: () => {
      toast({
        title: "Erro ao gerar lista",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsGeneratingPacking(false);
    },
  });

  const parseAIPackingSuggestions = (suggestions: string) => {
    // Converter sugestões de texto da IA em itens estruturados
    const items: PackingItem[] = [];
    const lines = suggestions.split('\n');
    
    lines.forEach((line, index) => {
      if (line.trim() && !line.includes('recomendações') && !line.includes('categoria')) {
        const category = line.toLowerCase().includes('roupa') ? 'clothing' :
                        line.toLowerCase().includes('eletrônico') ? 'electronics' :
                        line.toLowerCase().includes('documento') ? 'documents' : 'health';
        
        items.push({
          id: `ai-${index}`,
          name: line.trim().replace(/^[-•*]\s*/, ''),
          category,
          checked: false,
          isCustom: false
        });
      }
    });
    
    return items;
  };

  const handleGeneratePacking = () => {
    setIsGeneratingPacking(true);
    generatePackingMutation.mutate();
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    
    const item: PackingItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      checked: false,
      isCustom: true
    };
    
    setPackingItems(prev => [...prev, item]);
    setNewItem({ name: "", category: "clothing" });
    setShowAddItem(false);
    
    toast({
      title: "Item adicionado!",
      description: "Item adicionado à lista de mala.",
    });
  };

  const handleToggleItem = (id: string) => {
    setPackingItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setPackingItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "Item removido da lista de mala.",
    });
  };

  const categoryIcons = {
    clothing: Shirt,
    electronics: Smartphone,
    documents: FileText,
    health: Heart,
  };

  const categoryLabels = {
    clothing: "Roupas",
    electronics: "Eletrônicos",
    documents: "Documentos",
    health: "Saúde",
  };

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>;
  const completedItems = packingItems.filter(item => item.checked).length;
  const totalItems = packingItems.length;
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Lista de Mala</h2>
        <p className="text-white/80">Organize o que levar na sua viagem</p>
      </div>

      {/* Trip Selection */}
      <div className="mb-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Selecione uma Viagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip: any) => (
              <button
                key={trip.id}
                onClick={() => setSelectedTrip(trip.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTrip === trip.id
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-white">{trip.name}</h4>
                  <p className="text-white/80 text-sm">{trip.destination}</p>
                  <p className="text-white/60 text-xs">
                    {new Date(trip.startDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedTrip && (
        <>
          {/* Actions Bar */}
          <div className="mb-6 flex flex-wrap gap-4">
            <Button
              onClick={handleGeneratePacking}
              disabled={isGeneratingPacking}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingPacking ? "Gerando..." : "Gerar Lista com IA"}
            </Button>
            
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Adicionar Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Nome do Item</Label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Ex: Camiseta, Carregador, Passaporte"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Categoria</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({...newItem, category: value})}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {categoryLabels[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddItem} className="flex-1">
                      Adicionar
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddItem(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Progress */}
          {totalItems > 0 && (
            <div className="mb-6">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Progresso da Lista</span>
                  <span className="text-white/80">{completedItems}/{totalItems}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {/* Packing List by Category */}
          {totalItems > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {categories.map(category => {
                const categoryItems = packingItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;
                
                const IconComponent = categoryIcons[category];
                
                return (
                  <GlassCard key={category} className="p-6">
                    <div className="flex items-center mb-4">
                      <IconComponent className="mr-3 h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">{categoryLabels[category]}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {categoryItems.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {categoryItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center flex-1">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={() => handleToggleItem(item.id)}
                              className="mr-3"
                            />
                            <span className={`text-white ${item.checked ? 'line-through opacity-60' : ''}`}>
                              {item.name}
                            </span>
                            {item.isCustom && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Manual
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard className="p-12 text-center">
              <Package className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Lista Vazia</h3>
              <p className="text-white/80 mb-4">Comece gerando uma lista com IA ou adicione itens manualmente</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleGeneratePacking} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar com IA
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddItem(true)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {!selectedTrip && (
        <GlassCard className="p-12 text-center">
          <Package className="h-16 w-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Selecione uma Viagem</h3>
          <p className="text-white/80 mb-4">Escolha uma viagem para criar sua lista de mala</p>
          <Button
            onClick={() => onNavigate("create-trip")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Nova Viagem
          </Button>
        </GlassCard>
      )}
    </div>
  );
}