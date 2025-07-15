import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, MapPin, Clock, Utensils, Camera, Mountain, Plus, Sparkles, ChevronRight } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InteractiveMap } from "@/components/InteractiveMap";
import { PDFExporter } from "@/components/PDFExporter";
import { Lightbulb, Map } from "lucide-react";

interface ItineraryProps {
  onNavigate: (section: string) => void;
}

const addActivitySchema = z.object({
  time: z.string().min(1, "Horário é obrigatório"),
  activity: z.string().min(1, "Atividade é obrigatória"),
  location: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
  estimatedCost: z.string().optional(),
});

type AddActivityForm = z.infer<typeof addActivitySchema>;

export function Itinerary({ onNavigate }: ItineraryProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localTips, setLocalTips] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: itineraryItems = [] } = useQuery({
    queryKey: ["/api/trips", selectedTrip, "itinerary"],
    enabled: !!selectedTrip,
  });

  const addActivityForm = useForm<AddActivityForm>({
    resolver: zodResolver(addActivitySchema),
    defaultValues: {
      time: "",
      activity: "",
      location: "",
      category: "",
      duration: "",
      notes: "",
      estimatedCost: "",
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: AddActivityForm) => {
      if (!selectedTrip || !selectedDate) return;

      return apiRequest("/api/itinerary", {
        method: "POST",
        body: {
          ...data,
          tripId: selectedTrip,
          date: selectedDate.toISOString(),
          city: selectedTripData?.destination || "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "itinerary"] });
      setShowAddActivity(false);
      addActivityForm.reset();
      toast({
        title: "Atividade adicionada!",
        description: "A atividade foi adicionada ao seu cronograma.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar atividade",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const generateAIMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrip || !selectedTripData) return;

      return apiRequest("/api/ai/generate-trip", {
        method: "POST",
        body: {
          destination: selectedTripData.destination,
          startDate: selectedTripData.startDate,
          endDate: selectedTripData.endDate,
          budget: selectedTripData.budget,
          travelStyle: selectedTripData.travelStyle,
          preferences: selectedTripData.preferences,
        },
      });
    },
    onSuccess: async (data) => {
      if (data?.itinerary) {
        // Adicionar cada item do itinerário gerado
        for (const day of data.itinerary) {
          for (const activity of day.activities) {
            await apiRequest("/api/itinerary", {
              method: "POST",
              body: {
                tripId: selectedTrip,
                date: day.date,
                city: day.city,
                time: activity.time,
                activity: activity.activity,
                location: activity.location,
                notes: activity.notes,
                category: "attraction",
                duration: "1-2 horas",
                estimatedCost: "R$ 0-50",
              },
            });
          }
        }
        if (data?.localTips && Array.isArray(data?.localTips)) {
           setLocalTips(data.localTips);
        }

        queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "itinerary"] });
        toast({
          title: "Cronograma gerado com sucesso!",
          description: "A IA criou um cronograma completo para sua viagem.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao gerar cronograma",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    generateAIMutation.mutate();
  };

  const handleAddActivity = (data: AddActivityForm) => {
    addActivityMutation.mutate(data);
  };

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
                    : "border-white/20 hover:border-[#667EEA]/50"
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
                    <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Atividade
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Adicionar Atividade</DialogTitle>
                        </DialogHeader>
                        <Form {...addActivityForm}>
                          <form onSubmit={addActivityForm.handleSubmit(handleAddActivity)} className="space-y-4">
                            <FormField
                              control={addActivityForm.control}
                              name="time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Horário</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: 14:00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="activity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Atividade</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Visitar museu" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Local</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Museu do Louvre" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Categoria</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="food">Alimentação</SelectItem>
                                      <SelectItem value="attraction">Atração</SelectItem>
                                      <SelectItem value="adventure">Aventura</SelectItem>
                                      <SelectItem value="transport">Transporte</SelectItem>
                                      <SelectItem value="accommodation">Hospedagem</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="duration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Duração</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: 2 horas" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="estimatedCost"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Custo Estimado</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: R$ 50" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addActivityForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Observações</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Notas adicionais..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setShowAddActivity(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={addActivityMutation.isPending}>
                                {addActivityMutation.isPending ? "Adicionando..." : "Adicionar"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      size="sm" 
                      className="bg-[#F093FB] hover:bg-[#F093FB]/90"
                      onClick={handleGenerateAI}
                      disabled={generateAIMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generateAIMutation.isPending ? "Gerando..." : "Gerar com IA"}
                    </Button>
                  </div>
                </div>

                {selectedDateItems.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Nenhuma atividade programada</h4>
                    <p className="text-white/70 mb-4">Adicione atividades ou deixe a IA criar um cronograma perfeito para você</p>
                    <Button 
                      className="bg-[#F093FB] hover:bg-[#F093FB]/90 text-white"
                      onClick={handleGenerateAI}
                      disabled={generateAIMutation.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generateAIMutation.isPending ? "Gerando Cronograma..." : "Gerar Cronograma com IA"}
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
      {selectedTrip && selectedTripData && (
          <>
           {/* Generate AI Itinerary */}
            <GlassCard className="p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Geração Inteligente de Roteiro</h3>
                  <p className="text-white/70">Deixe a IA criar um roteiro personalizado baseado na sua viagem</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowMap(!showMap)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    {showMap ? "Ocultar Mapa" : "Ver Mapa"}
                  </Button>
                  <Button
                    onClick={handleGenerateAI}
                    disabled={generateAIMutation.isPending}
                    className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
                  >
                    {generateAIMutation.isPending ? (
                      <Sparkles className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {generateAIMutation.isPending ? "Gerando..." : "Gerar Roteiro"}
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Dicas Locais */}
            {localTips.length > 0 && (
              <GlassCard className="p-6 mb-8 border-l-4 border-yellow-400">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-6 h-6 text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Dicas Locais Especiais</h3>
                    <div className="space-y-3">
                      {localTips.map((tip, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-4">
                          <p className="text-white/90">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
            {selectedDate && (
                <>
                  {/* Mapa Interativo */}
                  {showMap && selectedDateItems && selectedDateItems.length > 0 && (
                    <GlassCard className="p-6 mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Mapa do Roteiro</h3>
                        <PDFExporter 
                          elementId="itinerary-content"
                          filename={`roteiro-${selectedTripData?.name || 'viagem'}.pdf`}
                          className="ml-4"
                        />
                      </div>
                      <InteractiveMap
                        locations={selectedDateItems
                          .filter(item => item.location)
                          .map((item, index) => ({
                            lat: -22.9068 + (Math.random() - 0.5) * 0.1, // Coordenadas mocadas - seria obtido via geocoding
                            lng: -43.1729 + (Math.random() - 0.5) * 0.1,
                            title: item.activity,
                            description: `${item.time} - ${item.location}`
                          }))
                        }
                        className="w-full h-96"
                      />
                    </GlassCard>
                  )}
                </>
            )}
          </>
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