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
}

interface HotelRecommendation {
  name: string;
  rating: number;
  priceRange: string;
  justification: string;
  location: string;
}

interface AssistantResponse {
  schedule: DaySchedule[];
  hotels: HotelRecommendation[];
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
    if (!assistantResponse?.schedule) return null;

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
            </tr>
          </thead>
          <tbody>
            {assistantResponse.schedule.map((day, index) => (
              <tr key={index} className="border-b border-white/10">
                <td className="p-4 text-white/80 font-medium">Dia {day.day}</td>
                <td className="p-4 text-white/80">{day.date}</td>
                <td className="p-4 text-white/70">{day.morning}</td>
                <td className="p-4 text-white/70">{day.afternoon}</td>
                <td className="p-4 text-white/70">{day.evening}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHotelRecommendations = () => {
    if (!assistantResponse?.hotels) return null;

    return (
      <div className="grid gap-4">
        {assistantResponse.hotels.map((hotel, index) => (
          <GlassCard key={index} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{hotel.name}</h3>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white/80">{hotel.rating}/5</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-white/60" />
              <span className="text-white/80">{hotel.location}</span>
              <Badge variant="outline" className="ml-auto">
                {hotel.priceRange}
              </Badge>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {hotel.justification}
            </p>
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
      case 1: return "Criando cronograma personalizado...";
      case 2: return "Gerando sugestões de hospedagem...";
      case 3: return "Consolidando plano final...";
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Cronograma</TabsTrigger>
            <TabsTrigger value="hotels">Hospedagem</TabsTrigger>
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

          <TabsContent value="hotels">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-white">Hospedagem Estratégica</CardTitle>
                <CardDescription className="text-white/60">
                  Hotéis selecionados com base no seu cronograma
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {renderHotelRecommendations()}
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