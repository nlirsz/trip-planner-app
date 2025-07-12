import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Calendar, Clock, Star, Wifi, Car, Coffee, Plus, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccommodationsProps {
  onNavigate: (section: string) => void;
}

const addAccommodationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  checkIn: z.string().min(1, "Data de check-in é obrigatória"),
  checkOut: z.string().min(1, "Data de check-out é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  price: z.string().optional(),
  confirmationCode: z.string().optional(),
  contactInfo: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

type AddAccommodationForm = z.infer<typeof addAccommodationSchema>;

export function Accommodations({ onNavigate }: AccommodationsProps) {
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"booked" | "suggestions">("booked");
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: true,
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ["/api/trips", selectedTrip, "accommodations"],
    enabled: !!selectedTrip,
  });

  const selectedTripData = trips.find((trip: any) => trip.id === selectedTrip);
  const bookedAccommodations = accommodations.filter((acc: any) => acc.type === "booked");
  const suggestedAccommodations = accommodations.filter((acc: any) => acc.type === "suggestion");

  const addAccommodationForm = useForm<AddAccommodationForm>({
    resolver: zodResolver(addAccommodationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      checkIn: "",
      checkOut: "",
      type: "booked",
      price: "",
      confirmationCode: "",
      contactInfo: "",
      checkInTime: "15:00",
      checkOutTime: "11:00",
    },
  });

  const addAccommodationMutation = useMutation({
    mutationFn: async (data: AddAccommodationForm) => {
      if (!selectedTrip) return;
      
      return apiRequest("/api/accommodations", {
        method: "POST",
        body: {
          ...data,
          tripId: selectedTrip,
          checkIn: new Date(data.checkIn).toISOString(),
          checkOut: new Date(data.checkOut).toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "accommodations"] });
      setShowAddAccommodation(false);
      addAccommodationForm.reset();
      toast({
        title: "Hospedagem adicionada!",
        description: "A hospedagem foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar hospedagem",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrip || !selectedTripData) return;
      
      return apiRequest("/api/accommodations/suggestions", {
        method: "POST",
        body: {
          destination: selectedTripData.destination,
          checkIn: selectedTripData.startDate,
          checkOut: selectedTripData.endDate,
          budget: selectedTripData.budget,
          preferences: selectedTripData.preferences,
        },
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data?.suggestions) {
        setAiSuggestions(data.suggestions);
        toast({
          title: "Sugestões geradas!",
          description: "A IA encontrou ótimas opções de hospedagem para você.",
        });
      }
      setIsGeneratingSuggestions(false);
    },
    onError: () => {
      toast({
        title: "Erro ao gerar sugestões",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsGeneratingSuggestions(false);
    },
  });

  const handleAddAccommodation = (data: AddAccommodationForm) => {
    addAccommodationMutation.mutate(data);
  };

  const handleGenerateSuggestions = () => {
    setIsGeneratingSuggestions(true);
    generateSuggestionsMutation.mutate();
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
        <h2 className="text-3xl font-bold text-white mb-2">Hospedagens</h2>
        <p className="text-white/70">Gerencie suas reservas e veja sugestões da IA</p>
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
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setActiveTab("booked")}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === "booked"
                  ? "text-white bg-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/20"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Reservas Confirmadas</span>
            </button>
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === "suggestions"
                  ? "text-white bg-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/20"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Sugestões da IA</span>
            </button>
          </div>

          {/* Booked Accommodations */}
          {activeTab === "booked" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Suas Reservas</h3>
                <Dialog open={showAddAccommodation} onOpenChange={setShowAddAccommodation}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Reserva
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Hospedagem</DialogTitle>
                    </DialogHeader>
                    <Form {...addAccommodationForm}>
                      <form onSubmit={addAccommodationForm.handleSubmit(handleAddAccommodation)} className="space-y-4">
                        <FormField
                          control={addAccommodationForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Hotel</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Hotel Copacabana Palace" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAccommodationForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Av. Atlântica, 1702" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAccommodationForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Rio de Janeiro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addAccommodationForm.control}
                            name="checkIn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-in</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addAccommodationForm.control}
                            name="checkOut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Check-out</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={addAccommodationForm.control}
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
                                  <SelectItem value="booked">Reserva Confirmada</SelectItem>
                                  <SelectItem value="suggestion">Sugestão</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAccommodationForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: R$ 250/noite" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAccommodationForm.control}
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
                          <Button type="button" variant="outline" onClick={() => setShowAddAccommodation(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={addAccommodationMutation.isPending}>
                            {addAccommodationMutation.isPending ? "Adicionando..." : "Adicionar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bookedAccommodations.length === 0 ? (
                  <div className="lg:col-span-2">
                    <GlassCard className="p-8 text-center">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Nenhuma reserva adicionada</h3>
                      <p className="text-white/80 mb-4">Adicione suas reservas de hotel para organizar melhor sua viagem</p>
                      <Button 
                        className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
                        onClick={() => setShowAddAccommodation(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeira Reserva
                      </Button>
                    </GlassCard>
                  </div>
                ) : (
                  bookedAccommodations.map((accommodation: any) => (
                    <GlassCard key={accommodation.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="default">CONFIRMADO</Badge>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-600">4.8</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-[#1A202C]">{accommodation.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {accommodation.address}, {accommodation.city}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-600 uppercase">Check-in</Label>
                            <div className="font-semibold">
                              {format(new Date(accommodation.checkIn), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {accommodation.checkInTime || "15:00"}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 uppercase">Check-out</Label>
                            <div className="font-semibold">
                              {format(new Date(accommodation.checkOut), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {accommodation.checkOutTime || "11:00"}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Preço:</span>
                            <span className="font-semibold">{accommodation.price || "R$ 250/noite"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Código:</span>
                            <span className="font-semibold">{accommodation.confirmationCode || "N/A"}</span>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Badge variant="outline" className="flex items-center">
                            <Wifi className="w-3 h-3 mr-1" />
                            Wi-Fi
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Car className="w-3 h-3 mr-1" />
                            Estacionamento
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Coffee className="w-3 h-3 mr-1" />
                            Café da Manhã
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <FileText className="w-4 h-4 mr-2" />
                            Upload PDF
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <MapPin className="w-4 h-4 mr-2" />
                            Ver Mapa
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {activeTab === "suggestions" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Sugestões da IA</h3>
                <Button 
                  className="bg-[#F093FB] hover:bg-[#F093FB]/90 text-white"
                  onClick={handleGenerateSuggestions}
                  disabled={generateSuggestionsMutation.isPending}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generateSuggestionsMutation.isPending ? "Gerando..." : "Gerar Sugestões de Hotéis"}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Demo suggestions */}
                {[
                  {
                    id: 1,
                    name: "Hotel Boutique Central",
                    address: "Rua das Flores, 123",
                    city: "São Paulo",
                    price: "R$ 280/noite",
                    rating: 4.7,
                    amenities: ["Wi-Fi", "Piscina", "Spa"],
                    image: "/api/placeholder/300/200"
                  },
                  {
                    id: 2,
                    name: "Pousada Vista Mar",
                    address: "Av. Beira Mar, 456",
                    city: "Rio de Janeiro", 
                    price: "R$ 320/noite",
                    rating: 4.9,
                    amenities: ["Wi-Fi", "Praia", "Café"],
                    image: "/api/placeholder/300/200"
                  },
                  {
                    id: 3,
                    name: "Hostel Moderno",
                    address: "Rua Jovem, 789",
                    city: "São Paulo",
                    price: "R$ 85/noite",
                    rating: 4.3,
                    amenities: ["Wi-Fi", "Cozinha", "Lavanderia"],
                    image: "/api/placeholder/300/200"
                  }
                ].map((suggestion) => (
                  <GlassCard key={suggestion.id} className="p-4">
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{suggestion.name}</h4>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-white/70">{suggestion.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/70 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {suggestion.address}, {suggestion.city}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#667EEA]">{suggestion.price}</span>
                        <Badge variant="secondary" className="bg-[#F093FB]/20 text-[#F093FB]">IA</Badge>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {suggestion.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Detalhes
                        </Button>
                        <Button size="sm" className="flex-1 bg-[#667EEA] hover:bg-[#667EEA]/90">
                          Reservar
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}