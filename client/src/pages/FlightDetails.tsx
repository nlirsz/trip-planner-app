import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plane, MapPin, Clock, Calendar, QrCode, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FlightDetailsProps {
  onNavigate: (section: string) => void;
}

const addFlightSchema = z.object({
  flightNumber: z.string().min(1, "Número do voo é obrigatório"),
  airline: z.string().min(1, "Companhia aérea é obrigatória"),
  departureAirport: z.string().min(1, "Aeroporto de partida é obrigatório"),
  arrivalAirport: z.string().min(1, "Aeroporto de chegada é obrigatório"),
  departureTime: z.string().min(1, "Horário de partida é obrigatório"),
  arrivalTime: z.string().min(1, "Horário de chegada é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  seat: z.string().optional(),
  gate: z.string().optional(),
  confirmationCode: z.string().optional(),
});

type AddFlightForm = z.infer<typeof addFlightSchema>;

export function FlightDetails({ onNavigate }: FlightDetailsProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ["/api/trips", selectedTrip, "flights"],
    enabled: !!selectedTrip,
  });

  const addFlightForm = useForm<AddFlightForm>({
    resolver: zodResolver(addFlightSchema),
    defaultValues: {
      flightNumber: "",
      airline: "",
      departureAirport: "",
      arrivalAirport: "",
      departureTime: "",
      arrivalTime: "",
      type: "outbound",
      seat: "",
      gate: "",
      confirmationCode: "",
    },
  });

  const addFlightMutation = useMutation({
    mutationFn: async (data: AddFlightForm) => {
      if (!selectedTrip) return;
      
      return apiRequest("/api/flights", {
        method: "POST",
        body: {
          ...data,
          tripId: selectedTrip,
          departureTime: new Date(data.departureTime).toISOString(),
          arrivalTime: new Date(data.arrivalTime).toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "flights"] });
      setShowAddFlight(false);
      addFlightForm.reset();
      toast({
        title: "Voo adicionado!",
        description: "O voo foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar voo",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleAddFlight = (data: AddFlightForm) => {
    addFlightMutation.mutate(data);
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
        <h2 className="text-3xl font-bold text-white mb-2">Detalhes dos Voos</h2>
        <p className="text-white/70">Gerencie informações dos seus voos e aeroportos</p>
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
          {/* Add Flight Button */}
          <div className="flex justify-end">
            <Dialog open={showAddFlight} onOpenChange={setShowAddFlight}>
              <DialogTrigger asChild>
                <Button className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Voo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Voo</DialogTitle>
                </DialogHeader>
                <Form {...addFlightForm}>
                  <form onSubmit={addFlightForm.handleSubmit(handleAddFlight)} className="space-y-4">
                    <FormField
                      control={addFlightForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="outbound">Ida</SelectItem>
                              <SelectItem value="return">Volta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addFlightForm.control}
                        name="airline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Companhia Aérea</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: LATAM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addFlightForm.control}
                        name="flightNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Voo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: LA3050" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addFlightForm.control}
                        name="departureAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aeroporto de Partida</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: GRU" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addFlightForm.control}
                        name="arrivalAirport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aeroporto de Chegada</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: SDU" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addFlightForm.control}
                        name="departureTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Partida</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addFlightForm.control}
                        name="arrivalTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chegada</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addFlightForm.control}
                        name="seat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assento</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 12A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addFlightForm.control}
                        name="gate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portão</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: B15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addFlightForm.control}
                      name="confirmationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Confirmação</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: ABC123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddFlight(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={addFlightMutation.isPending}>
                        {addFlightMutation.isPending ? "Adicionando..." : "Adicionar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Flight Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flights.length === 0 ? (
              <div className="lg:col-span-2">
                <GlassCard className="p-8 text-center">
                  <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Nenhum voo adicionado</h3>
                  <p className="text-white/80 mb-4">Adicione seus voos para ver informações detalhadas do aeroporto</p>
                  <Button 
                    className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
                    onClick={() => setShowAddFlight(true)}
                  >
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
                    <span className="text-sm text-white/70">{flight.airline}</span>
                  </div>

                  <div className="space-y-4">
                    {/* Flight Route */}
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{flight.departureAirport}</div>
                        <div className="text-sm text-white/70">
                          {format(new Date(flight.departureTime), "HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-white/60">
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
                        <div className="text-2xl font-bold text-white">{flight.arrivalAirport}</div>
                        <div className="text-sm text-white/70">
                          {format(new Date(flight.arrivalTime), "HH:mm", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-white/60">
                          {format(new Date(flight.arrivalTime), "dd/MM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Flight Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Voo:</span>
                        <span className="ml-2 font-semibold text-white">{flight.flightNumber}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Assento:</span>
                        <span className="ml-2 font-semibold text-white">{flight.seat || "Não definido"}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Portão:</span>
                        <span className="ml-2 font-semibold text-white">{flight.gate || "A definir"}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Código:</span>
                        <span className="ml-2 font-semibold text-white">{flight.confirmationCode || "N/A"}</span>
                      </div>
                    </div>

                    {/* Airport Information */}
                    <div className="mt-4">
                      <h4 className="font-semibold text-white mb-2">Informações do Aeroporto</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-white/70">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>Selecione um hotel para calcular distância</span>
                        </div>
                        <div className="flex items-center text-sm text-white/70">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Tempo estimado: A definir</span>
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
            <h3 className="text-xl font-semibold text-white mb-4">Distâncias dos Aeroportos</h3>
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Nenhum hotel cadastrado</h4>
              <p className="text-white/70 mb-4">Adicione hotéis na aba "Hospedagens" para ver as distâncias calculadas</p>
              <Button 
                onClick={() => onNavigate("accommodations")}
                className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
              >
                Ir para Hospedagens
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}