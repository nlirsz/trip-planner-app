import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Clock, Star, DollarSign, CheckCircle } from "lucide-react";
import { Trip } from "@shared/schema";
import { GlassCard } from "./GlassCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TravelAssistantProps {
  trip: Trip;
  onNavigate: (section: string) => void;
}

interface DaySchedule {
  day: number;
  date: string;
  morning: string;
  afternoon: string;
  evening: string;
  mainArea: string;
}

interface HotelRecommendation {
  name: string;
  rating: number;
  priceRange: string;
  justification: string;
  location: string;
}

interface AssistantResponse {
  itineraryTable: DaySchedule[];
  lodgingStrategy: {
    geographicAnalysis: {
      activityCenters: Array<{
        area: string;
        daysSpent: number;
        percentage: number;
      }>;
      analysis: string;
    };
    recommendedNeighborhoods: Array<{
      name: string;
      priority: number;
      justification: string;
      proximityScore: number;
      transportAccess: string;
    }>;
  };
  strategicHotels: Array<{
    name: string;
    realHotel: boolean;
    neighborhood: string;
    profile: string;
    rating: number;
    priceRange: string;
    strategicFit: string;
    whyItFits: string;
  }>;
  summary: {
    totalDays: number;
    highlights: string[];
    recommendations: string[];
  };
}

export function TravelAssistant({ trip, onNavigate }: TravelAssistantProps) {
  const [currentTask, setCurrentTask] = useState<1 | 2 | 3 | null>(null);
  const [progress, setProgress] = useState(0);
  const [assistantResponse, setAssistantResponse] = useState<AssistantResponse | null>(null);
  const { toast } = useToast();

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      setCurrentTask(1);
      setProgress(20);
      
      const response = await apiRequest(`/api/trips/${trip.id}/elite-plan`, {
        method: "POST",
        body: JSON.stringify({
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.budget,
          travelStyle: trip.travelStyle,
          preferences: trip.preferences
        })
      });

      setProgress(50);
      setCurrentTask(2);
      
      // Simular processamento das tarefas
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(80);
      setCurrentTask(3);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);
      setCurrentTask(null);
      
      return response;
    },
    onSuccess: (data) => {
      setAssistantResponse(data);
      toast({
        title: "Plano Elite Gerado!",
        description: "Seu roteiro personalizado está pronto com cronograma e hospedagem estratégica.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar plano",
        description: "Não foi possível gerar o plano de viagem. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const renderScheduleTable = () => {
    if (!assistantResponse?.itineraryTable) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-4 text-white/90">Dia</th>
              <th className="text-left p-4 text-white/90">Data</th>
              <th className="text-left p-4 text-white/90">Manhã (09:00-12:00)</th>
              <th className="text-left p-4 text-white/90">Tarde (14:00-17:00)</th>
              <th className="text-left p-4 text-white/90">Noite (19:00-22:00)</th>
              <th className="text-left p-4 text-white/90">Área Principal</th>
            </tr>
          </thead>
          <tbody>
            {assistantResponse.itineraryTable.map((day, index) => (
              <tr key={index} className="border-b border-white/10">
                <td className="p-4 text-white/80 font-medium">Dia {day.day}</td>
                <td className="p-4 text-white/80">{day.date}</td>
                <td className="p-4 text-white/70">{day.morning}</td>
                <td className="p-4 text-white/70">{day.afternoon}</td>
                <td className="p-4 text-white/70">{day.evening}</td>
                <td className="p-4 text-white/60 text-sm">{day.mainArea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStrategicAnalysis = () => {
    if (!assistantResponse?.lodgingStrategy) return null;

    const { geographicAnalysis, recommendedNeighborhoods } = assistantResponse.lodgingStrategy;

    return (
      <div className="space-y-6">
        {/* Geographic Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Análise Geográfica do Roteiro</h3>
          <GlassCard className="p-4 mb-4">
            <p className="text-white/80 mb-4">{geographicAnalysis.analysis}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {geographicAnalysis.activityCenters.map((center, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-white">{center.daysSpent}</div>
                  <div className="text-sm text-white/70">{center.area}</div>
                  <div className="text-xs text-white/60">{center.percentage}% do tempo</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Recommended Neighborhoods */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Bairros Recomendados</h3>
          <div className="space-y-4">
            {recommendedNeighborhoods.map((neighborhood, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-medium text-white">{neighborhood.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Prioridade {neighborhood.priority}
                    </Badge>
                    <span className="text-sm text-white/80">{neighborhood.proximityScore}%</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-3 leading-relaxed">
                  {neighborhood.justification}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span>{neighborhood.transportAccess}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStrategicHotels = () => {
    if (!assistantResponse?.strategicHotels) return null;

    return (
      <div className="grid gap-4">
        {assistantResponse.strategicHotels.map((hotel, index) => (
          <GlassCard key={index} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{hotel.name}</h3>
              <div className="flex items-center gap-2">
                {hotel.realHotel && (
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300">
                    Hotel Real
                  </Badge>
                )}
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white/80">{hotel.rating}/5</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-white/60" />
              <span className="text-white/80">{hotel.neighborhood}</span>
              <Badge variant="outline" className="ml-auto">
                {hotel.profile}
              </Badge>
            </div>
            <div className="text-sm text-white/70 mb-2">
              <strong>Faixa de Preço:</strong> {hotel.priceRange}
            </div>
            <div className="mb-3">
              <p className="text-white/70 text-sm leading-relaxed mb-2">
                <strong>Estratégia:</strong> {hotel.strategicFit}
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                <strong>Por que se encaixa:</strong> {hotel.whyItFits}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    if (!assistantResponse?.summary) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Cronograma Otimizado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Duração Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{assistantResponse.summary.totalDays} dias</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Orçamento</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ {trip.budget}</p>
            </GlassCard>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Destaques do Plano</h3>
          <div className="space-y-2">
            {assistantResponse.summary.highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/80">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Recomendações Finais</h3>
          <div className="space-y-2">
            {assistantResponse.summary.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/80">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getTaskLabel = (task: number) => {
    switch (task) {
      case 1: return "Criando cronograma detalhado...";
      case 2: return "Analisando estratégia de hospedagem...";
      case 3: return "Sugerindo hotéis estratégicos...";
      default: return "";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Assistente de Viagens Elite
        </h1>
        <p className="text-white/70">
          Plano completo com cronograma otimizado e hospedagem estratégica para {trip.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">Destino</span>
          </div>
          <p className="text-white/80">{trip.destination}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">Período</span>
          </div>
          <p className="text-white/80">{trip.startDate} a {trip.endDate}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">Orçamento</span>
          </div>
          <p className="text-white/80">R$ {trip.budget}</p>
        </GlassCard>
      </div>

      {generatePlanMutation.isPending && (
        <GlassCard className="p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-white font-medium">
                {currentTask ? getTaskLabel(currentTask) : "Iniciando análise..."}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-white/60 text-sm">
              Processando suas preferências para criar o plano perfeito...
            </p>
          </div>
        </GlassCard>
      )}

      {!assistantResponse && !generatePlanMutation.isPending && (
        <GlassCard className="p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Gerar Plano Elite Personalizado
          </h2>
          <p className="text-white/70 mb-6">
            Crie um roteiro completo com cronograma otimizado e recomendações de hospedagem 
            baseadas na sua viagem para {trip.destination}
          </p>
          <Button 
            onClick={() => generatePlanMutation.mutate()}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Gerar Plano Completo
          </Button>
        </GlassCard>
      )}

      {assistantResponse && (
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">Cronograma</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="hotels">Hotéis</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Cronograma Personalizado</CardTitle>
                <CardDescription className="text-white/60">
                  Roteiro diário otimizado para sua viagem
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderScheduleTable()}
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="analysis">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Análise Estratégica</CardTitle>
                <CardDescription className="text-white/60">
                  Análise geográfica e recomendação de bairros
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderStrategicAnalysis()}
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="hotels">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Hotéis Estratégicos</CardTitle>
                <CardDescription className="text-white/60">
                  Hotéis reais selecionados nos bairros recomendados
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderStrategicHotels()}
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="summary">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Resumo do Plano</CardTitle>
                <CardDescription className="text-white/60">
                  Visão consolidada do seu roteiro completo
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderSummary()}
              </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}