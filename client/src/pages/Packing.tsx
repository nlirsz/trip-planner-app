import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckSquare, Plus, Sparkles, Shirt, Zap, FileText, Heart, Thermometer, Cloud, Sun } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PackingProps {
  onNavigate: (section: string) => void;
}

export function Packing({ onNavigate }: PackingProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [customItem, setCustomItem] = useState("");

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const selectedTripData = trips.find((trip: any) => trip.id === selectedTrip);

  const handleItemToggle = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const addCustomItem = () => {
    if (customItem.trim()) {
      // Here you would typically add to a state or make an API call
      setCustomItem("");
    }
  };

  // Demo packing list based on AI suggestions
  const packingList = {
    roupas: [
      { id: "camisetas", name: "Camisetas", quantity: "5 unidades", weather: "Ideal para 25°C" },
      { id: "calcas", name: "Calças", quantity: "3 unidades", weather: "Versátil" },
      { id: "underwear", name: "Roupas íntimas", quantity: "7 unidades", weather: "" },
      { id: "pijama", name: "Pijamas", quantity: "2 unidades", weather: "" },
      { id: "jaqueta", name: "Jaqueta leve", quantity: "1 unidade", weather: "Para noites de 15°C" },
      { id: "sapatos", name: "Sapatos confortáveis", quantity: "2 pares", weather: "" },
      { id: "chinelos", name: "Chinelos", quantity: "1 par", weather: "" },
    ],
    eletronicos: [
      { id: "celular", name: "Celular", quantity: "1 unidade", weather: "" },
      { id: "carregador", name: "Carregador", quantity: "1 unidade", weather: "" },
      { id: "powerbank", name: "Power Bank", quantity: "1 unidade", weather: "" },
      { id: "camera", name: "Câmera", quantity: "1 unidade", weather: "" },
      { id: "adaptador", name: "Adaptador universal", quantity: "1 unidade", weather: "" },
    ],
    documentos: [
      { id: "passaporte", name: "Passaporte", quantity: "1 unidade", weather: "" },
      { id: "identidade", name: "RG", quantity: "1 unidade", weather: "" },
      { id: "cartao", name: "Cartões de crédito", quantity: "2 unidades", weather: "" },
      { id: "seguro", name: "Seguro viagem", quantity: "1 cópia", weather: "" },
      { id: "passagens", name: "Passagens aéreas", quantity: "1 cópia", weather: "" },
    ],
    saude: [
      { id: "remedios", name: "Remédios pessoais", quantity: "Conforme necessário", weather: "" },
      { id: "protetor", name: "Protetor solar", quantity: "1 unidade", weather: "FPS 60 recomendado" },
      { id: "repelente", name: "Repelente", quantity: "1 unidade", weather: "" },
      { id: "band-aid", name: "Curativos", quantity: "1 caixa", weather: "" },
      { id: "termometro", name: "Termômetro", quantity: "1 unidade", weather: "" },
    ],
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "roupas": return <Shirt className="w-5 h-5" />;
      case "eletronicos": return <Zap className="w-5 h-5" />;
      case "documentos": return <FileText className="w-5 h-5" />;
      case "saude": return <Heart className="w-5 h-5" />;
      default: return <CheckSquare className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "roupas": return "bg-blue-100 text-blue-800";
      case "eletronicos": return "bg-purple-100 text-purple-800";
      case "documentos": return "bg-green-100 text-green-800";
      case "saude": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalItems = () => {
    return Object.values(packingList).reduce((total, category) => total + category.length, 0);
  };

  const getCheckedCount = () => {
    return checkedItems.size;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Check-list de Mala</h2>
        <p className="text-white/70">Lista inteligente baseada no clima e duração da viagem</p>
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
                    ? "border-[#667EEA] bg-[#667EEA]/10"
                    : "border-gray-200 hover:border-[#667EEA]/50"
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-white">{trip.name}</h4>
                  <p className="text-sm text-white/90">{trip.destination}</p>
                  <p className="text-xs text-white/80 mt-1">
                    {format(new Date(trip.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(trip.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedTrip && (
        <div className="space-y-6">
          {/* Weather Information */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Informações do Clima</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <Sun className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <div className="font-semibold text-yellow-800">Temperatura Média</div>
                  <div className="text-sm text-yellow-700">22°C - 28°C</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Cloud className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="font-semibold text-blue-800">Chuva</div>
                  <div className="text-sm text-blue-700">Baixa probabilidade</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <Thermometer className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="font-semibold text-green-800">Recomendação</div>
                  <div className="text-sm text-green-700">Roupas leves</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Progress */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#1A202C]">
                Progresso da Mala ({getCheckedCount()}/{getTotalItems()})
              </h3>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setCheckedItems(new Set())}
                >
                  Limpar
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#F093FB] hover:bg-[#F093FB]/90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerar com IA
                </Button>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-[#667EEA] h-3 rounded-full transition-all duration-300"
                style={{ width: `${(getCheckedCount() / getTotalItems()) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round((getCheckedCount() / getTotalItems()) * 100)}% completo
            </p>
          </GlassCard>

          {/* Packing Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(packingList).map(([category, items]) => (
              <GlassCard key={category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                      <span className="ml-2 capitalize">{category}</span>
                    </div>
                    <Badge variant="outline">
                      {items.filter(item => checkedItems.has(item.id)).length}/{items.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => handleItemToggle(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={item.id}
                          className={`block font-medium cursor-pointer ${
                            checkedItems.has(item.id) ? "text-gray-500 line-through" : "text-[#1A202C]"
                          }`}
                        >
                          {item.name}
                        </label>
                        <p className="text-sm text-gray-600">{item.quantity}</p>
                        {item.weather && (
                          <p className="text-xs text-blue-600 mt-1">{item.weather}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Custom Items */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Itens Personalizados</h3>
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Adicione um item personalizado..."
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                className="flex-1"
              />
              <Button onClick={addCustomItem} className="bg-[#667EEA] hover:bg-[#667EEA]/90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Adicione itens específicos que você precisa levar para esta viagem
            </p>
          </GlassCard>

          {/* Tips */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Dicas da IA</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Dica do Clima</p>
                  <p className="text-sm text-blue-800">
                    O clima estará quente durante o dia (28°C) e ameno à noite (18°C). Leve roupas em camadas.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckSquare className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Dica de Bagagem</p>
                  <p className="text-sm text-green-800">
                    Para 5 dias, essa quantidade de roupas é ideal. Considere levar uma mala de mão.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900">Dica de Eletrônicos</p>
                  <p className="text-sm text-purple-800">
                    Verifique se precisa de adaptador para tomadas locais. O país usa padrão tipo C.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}