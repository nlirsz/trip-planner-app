import { useQuery } from "@tanstack/react-query";
import { TravelAssistant } from "@/components/TravelAssistant";
import { Trip } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface TravelAssistantPageProps {
  tripId?: number;
  onNavigate: (section: string) => void;
}

export function TravelAssistantPage({ tripId, onNavigate }: TravelAssistantPageProps) {
  const { data: trip, isLoading } = useQuery<Trip>({
    queryKey: [`/api/trips/${tripId}`],
    enabled: !!tripId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <GlassCard className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/70">Carregando dados da viagem...</p>
        </GlassCard>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <GlassCard className="p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Viagem não encontrada
          </h2>
          <p className="text-white/70 mb-6">
            Selecione uma viagem para usar o assistente elite
          </p>
          <Button 
            onClick={() => onNavigate("my-trips")}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Minhas Viagens
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button 
            onClick={() => onNavigate("my-trips")}
            variant="ghost"
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Minhas Viagens
          </Button>
        </div>
        
        <TravelAssistant 
          trip={trip} 
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}