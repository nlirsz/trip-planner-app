import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plane, MapPin, Clock, Calendar, QrCode, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FlightDetailsProps {
  onNavigate: (section: string) => void;
}

export function FlightDetails({ onNavigate }: FlightDetailsProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ["/api/flights", selectedTrip],
    enabled: !!selectedTrip,
  });

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
        <h2 className="text-3xl font-bold text-white mb-2">Detalhes dos Voos</h2>
        <p className="text-white/70">Gerencie informações dos seus voos e aeroportos</p>
      </div>

      {/* Trip Selection */}
      <div className="mb-6">
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Selecione uma Viagem</h3>
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
                  <h4 className="font-semibold text-[#1A202C]">{trip.name}</h4>
                  <p className="text-sm text-gray-600">{trip.destination}</p>
                  <p className="text-xs text-gray-500 mt-1">
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
          {/* Add Flight Button */}
          <div className="flex justify-end">
            <Button className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Voo
            </Button>
          </div>

          {/* Flight Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flights.length === 0 ? (
              <div className="lg:col-span-2">
                <GlassCard className="p-8 text-center">
                  <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1A202C] mb-2">Nenhum voo adicionado</h3>
                  <p className="text-gray-600 mb-4">Adicione seus voos para ver informações detalhadas do aeroporto</p>
                  <Button className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Voo
                  </Button>
                </GlassCard>
              </div>
            ) : (
              flights.map((flight: any) => (
                <GlassCard key={flight.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={flight.type === "outbound" ? "default" : "secondary"}>
                      {flight.type === "outbound" ? "IDA" : "VOLTA"}
                    </Badge>
                    <span className="text-sm text-gray-600">{flight.airline}</span>
                  </div>

                  <div className="space-y-4">
                    {/* Flight Route */}
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1A202C]">{flight.departureAirport}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(flight.departureTime), "HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(flight.departureTime), "dd/MM", { locale: ptBR })}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-[#667EEA] rounded-full"></div>
                          <div className="w-16 h-0.5 bg-gray-300 mx-2"></div>
                          <Plane className="w-4 h-4 text-[#667EEA]" />
                          <div className="w-16 h-0.5 bg-gray-300 mx-2"></div>
                          <div className="w-4 h-4 bg-[#667EEA] rounded-full"></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1A202C]">{flight.arrivalAirport}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(flight.arrivalTime), "HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(flight.arrivalTime), "dd/MM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Flight Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Voo:</span>
                        <span className="ml-2 font-semibold">{flight.flightNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assento:</span>
                        <span className="ml-2 font-semibold">{flight.seat || "Não definido"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Portão:</span>
                        <span className="ml-2 font-semibold">{flight.gate || "A definir"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Código:</span>
                        <span className="ml-2 font-semibold">{flight.confirmationCode || "N/A"}</span>
                      </div>
                    </div>

                    {/* Airport Information */}
                    <div className="mt-4">
                      <h4 className="font-semibold text-[#1A202C] mb-2">Informações do Aeroporto</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>Distância até o hotel: Calculando...</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Tempo estimado: 45 min</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        Ver Mapa
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <QrCode className="w-4 h-4 mr-2" />
                        Check-in
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>

          {/* Airport Distance Information */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-[#1A202C] mb-4">Distâncias dos Aeroportos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-semibold">Aeroporto → Primeiro Hotel</div>
                    <div className="text-sm text-gray-600">Hotel Central Plaza</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">24 km</div>
                  <div className="text-sm text-gray-600">~35 min</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-semibold">Último Hotel → Aeroporto</div>
                    <div className="text-sm text-gray-600">Beach Resort</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">18 km</div>
                  <div className="text-sm text-gray-600">~25 min</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}