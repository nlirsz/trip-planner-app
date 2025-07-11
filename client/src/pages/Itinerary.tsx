import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, MapPin, Clock, Utensils, Camera, Mountain, Plus, Sparkles, ChevronRight } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ItineraryProps {
  onNavigate: (section: string) => void;
}

export function Itinerary({ onNavigate }: ItineraryProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: itineraryItems = [] } = useQuery({
    queryKey: ["/api/itinerary", selectedTrip],
    enabled: !!selectedTrip,
  });

  const selectedTripData = trips.find((trip: any) => trip.id === selectedTrip);
  
  // Set calendar month to trip start date when trip is selected
  useEffect(() => {
    if (selectedTripData && selectedTripData.startDate) {
      const tripStartDate = new Date(selectedTripData.startDate);
      setCalendarMonth(tripStartDate);
      // Auto-select first day of trip if no date selected
      if (!selectedDate) {
        setSelectedDate(tripStartDate);
      }
    }
  }, [selectedTripData, selectedDate]);
  const selectedDateItems = itineraryItems.filter((item: any) => 
    selectedDate && isSameDay(new Date(item.date), selectedDate)
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "food": return <Utensils className="w-4 h-4" />;
      case "attraction": return <Camera className="w-4 h-4" />;
      case "adventure": return <Mountain className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "food": return "bg-orange-100 text-orange-800";
      case "attraction": return "bg-blue-100 text-blue-800";
      case "adventure": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Generate trip dates for calendar
  const tripDates = selectedTripData ? 
    Array.from({ length: Math.ceil((new Date(selectedTripData.endDate).getTime() - new Date(selectedTripData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 }, 
      (_, i) => new Date(new Date(selectedTripData.startDate).getTime() + i * 24 * 60 * 60 * 1000)
    ) : [];

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
        <h2 className="text-3xl font-bold text-white mb-2">Cronograma da Viagem</h2>
        <p className="text-white/70">Planeje seu itinerário dia a dia com sugestões personalizadas</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Calendário da Viagem</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                className="rounded-md border bg-white/10 text-white"
                locale={ptBR}
                disabled={(date) => !tripDates.some(tripDate => isSameDay(date, tripDate))}
              />
              
              {selectedTripData && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">{selectedTripData.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-white/90">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedTripData.destination}
                    </div>
                    <div className="flex items-center text-white/90">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(new Date(selectedTripData.startDate), "dd/MM", { locale: ptBR })} - {format(new Date(selectedTripData.endDate), "dd/MM", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Daily Itinerary */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <p className="text-white/80">Cidade: {selectedTripData?.destination}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Atividade
                    </Button>
                    <Button size="sm" className="bg-[#F093FB] hover:bg-[#F093FB]/90">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar com IA
                    </Button>
                  </div>
                </div>

                {selectedDateItems.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Nenhuma atividade programada</h4>
                    <p className="text-white/70 mb-4">Adicione atividades ou deixe a IA criar um cronograma perfeito para você</p>
                    <Button className="bg-[#F093FB] hover:bg-[#F093FB]/90 text-white">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Cronograma com IA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateItems.map((item: any, index: number) => (
                      <div key={item.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-lg font-semibold text-[#667EEA]">{item.time}</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                              {getCategoryIcon(item.category)}
                              <span className="ml-1">{item.category}</span>
                            </div>
                            {item.duration && (
                              <Badge variant="outline" className="text-xs">
                                {item.duration}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-white mb-1">{item.activity}</h4>
                          
                          {item.location && (
                            <p className="text-sm text-white/70 flex items-center mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {item.location}
                            </p>
                          )}
                          
                          {item.notes && (
                            <p className="text-sm text-white/70 mb-2">{item.notes}</p>
                          )}
                          
                          {item.estimatedCost && (
                            <p className="text-sm font-medium text-[#667EEA]">
                              Custo estimado: {item.estimatedCost}
                            </p>
                          )}
                        </div>

                        <Button size="sm" variant="ghost" className="flex-shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ) : (
              <GlassCard className="p-8 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1A202C] mb-2">Selecione um dia</h3>
                <p className="text-gray-600">Escolha uma data no calendário para ver ou criar o cronograma do dia</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {selectedTrip && (
        <div className="mt-8">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-[#1A202C] mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Sparkles className="w-6 h-6 mb-2" />
                <span className="text-sm">Gerar Cronograma Completo</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Utensils className="w-6 h-6 mb-2" />
                <span className="text-sm">Adicionar Restaurantes</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Camera className="w-6 h-6 mb-2" />
                <span className="text-sm">Pontos Turísticos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Mountain className="w-6 h-6 mb-2" />
                <span className="text-sm">Atividades Aventura</span>
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}