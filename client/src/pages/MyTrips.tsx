import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trip } from "@shared/schema";
import { Plus } from "lucide-react";

interface MyTripsProps {
  onNavigate: (section: string) => void;
  onTripSelect: (trip: Trip) => void;
}

export function MyTrips({ onNavigate, onTripSelect }: MyTripsProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const filteredTrips = trips.filter(trip => {
    if (statusFilter === "all") return true;
    return trip.status === statusFilter;
  });

  const handleViewDetails = (trip: Trip) => {
    onTripSelect(trip);
  };

  const handleEdit = (trip: Trip) => {
    // Navigate to edit mode - this would open the CreateTrip form with pre-filled data
    onNavigate("create-trip");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-white/20 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-white/20 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Minhas Viagens</h2>
            <p className="text-white/90">Gerencie e acompanhe todas as suas aventuras</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-black/30 border-white/20 text-white focus:ring-[#667EEA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Viagens</SelectItem>
                <SelectItem value="planning">Planejando</SelectItem>
                <SelectItem value="upcoming">Próximas</SelectItem>
                <SelectItem value="in-progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => onNavigate("create-trip")}
              className="bg-[#667EEA] hover:bg-[#667EEA]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Viagem
            </Button>
          </div>
        </div>
      </div>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 bg-[#667EEA]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#667EEA]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {statusFilter === "all" ? "Nenhuma viagem ainda" : `Nenhuma viagem ${statusFilter}`}
          </h3>
          <p className="text-white/80 mb-6">
            {statusFilter === "all" 
              ? "Comece a planejar sua primeira aventura com nosso planejador de viagens alimentado por IA!"
              : `Você não tem nenhuma viagem ${statusFilter} no momento.`
            }
          </p>
          <Button
            onClick={() => onNavigate("create-trip")}
            className="bg-[#667EEA] hover:bg-[#667EEA]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crie Sua Primeira Viagem
          </Button>
        </GlassCard>
      )}
    </div>
  );
}
