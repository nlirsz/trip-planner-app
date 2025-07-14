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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Calendar, Clock, Star, Wifi, Car, Coffee, Plus, FileText, Sparkles, Bot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { googlePlaces, searchHotelsInDestination } from "@/lib/google-places";
import { HotelRecommendationPanel } from "@/components/HotelRecommendationPanel";
import { ItineraryHotelRecommendations } from "@/components/ItineraryHotelRecommendations";
import { HotelRecommendation } from "@/lib/hotel-recommendations";

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
  const [activeTab, setActiveTab] = useState<"booked" | "suggestions" | "ai-recommendations">("booked");
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
      
      try {
        // Get itinerary data to understand locations to visit
        const itineraryResponse = await apiRequest(`/api/trips/${selectedTrip}/itinerary`);
        const itineraryItems = itineraryResponse || [];
        
        // Extract unique locations from itinerary
        const visitedLocations = [...new Set(itineraryItems.map((item: any) => item.location))];
        const visitedCities = [...new Set(itineraryItems.map((item: any) => item.city))];
        
        console.log("Visited locations:", visitedLocations);
        console.log("Trip budget:", selectedTripData.budget);
        console.log("Travel style:", selectedTripData.travelStyle);
        
        // Use Google Places API to get real hotel suggestions
        const hotels = await searchHotelsInDestination(selectedTripData.destination);
        
        // Helper function to get budget level
        const getBudgetLevel = (budget: string) => {
          const budgetNum = parseInt(budget) || 0;
          if (budgetNum < 1000) return 1; // Budget
          if (budgetNum < 3000) return 2; // Mid-range
          if (budgetNum < 5000) return 3; // Upscale
          return 4; // Luxury
        };

        // Helper function to get price range
        const getPriceRange = (priceLevel: number) => {
          const ranges = {
            1: "R$ 80-150",
            2: "R$ 150-300", 
            3: "R$ 300-500",
            4: "R$ 500+"
          };
          return ranges[priceLevel as keyof typeof ranges] || "Consultar preços";
        };

        // Helper function to get amenities based on hotel types and travel style
        const getAmenitiesFromType = (types: string[], travelStyle: string[]) => {
          const baseAmenities = ["Wi-Fi", "Ar condicionado"];
          
          if (types.includes('spa')) baseAmenities.push("Spa");
          if (types.includes('gym')) baseAmenities.push("Academia");
          if (types.includes('restaurant')) baseAmenities.push("Restaurante");
          if (types.includes('bar')) baseAmenities.push("Bar");
          if (types.includes('lodging')) baseAmenities.push("Estacionamento");
          
          if (travelStyle.includes('luxury')) {
            baseAmenities.push("Concierge", "Room Service");
          }
          if (travelStyle.includes('adventure')) {
            baseAmenities.push("Depósito de equipamentos");
          }
          if (travelStyle.includes('cultural')) {
            baseAmenities.push("Centro de negócios");
          }
          
          return baseAmenities.slice(0, 5);
        };

        // Helper function to calculate proximity score
        const getProximityScore = (hotel: any, visitedLocations: string[]) => {
          const hotelLocation = hotel.vicinity || hotel.formatted_address;
          let score = 0;
          
          visitedLocations.forEach(location => {
            if (hotelLocation.toLowerCase().includes(location.toLowerCase())) {
              score += 10;
            }
          });
          
          return score;
        };

        // Filter hotels based on budget and proximity to visited locations
        const budgetLevel = getBudgetLevel(selectedTripData.budget);
        const travelStylePrefs = selectedTripData.travelStyle || [];
        
        let filteredHotels = hotels
          .filter(hotel => {
            // Filter by price level based on budget
            const priceLevel = hotel.price_level || 2;
            return priceLevel <= budgetLevel;
          })
          .filter(hotel => {
            // Filter by location relevance if we have itinerary data
            if (visitedLocations.length === 0) return true;
            
            const hotelLocation = hotel.vicinity || hotel.formatted_address;
            return visitedLocations.some(location => 
              hotelLocation.toLowerCase().includes(location.toLowerCase()) ||
              location.toLowerCase().includes(hotelLocation.toLowerCase())
            );
          })
          .sort((a, b) => {
            // Sort by rating, proximity, and number of reviews
            const ratingA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
            const ratingB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
            
            const proximityA = getProximityScore(a, visitedLocations);
            const proximityB = getProximityScore(b, visitedLocations);
            
            return (ratingB + proximityB) - (ratingA + proximityA);
          });

        // If we don't have enough filtered results, add some from the original list
        if (filteredHotels.length < 3) {
          const additionalHotels = hotels
            .filter(hotel => !filteredHotels.some(f => f.place_id === hotel.place_id))
            .slice(0, 6 - filteredHotels.length);
          
          filteredHotels = [...filteredHotels, ...additionalHotels];
        }

        // Transform Google Places results to our format
        const suggestions = filteredHotels.slice(0, 6).map(hotel => ({
          name: hotel.name,
          address: hotel.formatted_address,
          rating: hotel.rating || 0,
          price_level: hotel.price_level || 0,
          place_id: hotel.place_id,
          types: hotel.types || [],
          vicinity: hotel.vicinity || '',
          photos: hotel.photos || [],
          description: `${hotel.name} - ${hotel.vicinity || selectedTripData.destination}`,
          amenities: getAmenitiesFromType(hotel.types || [], travelStylePrefs),
          priceRange: getPriceRange(hotel.price_level || 2),
          proximityScore: getProximityScore(hotel, visitedLocations),
          budgetMatch: (hotel.price_level || 2) <= budgetLevel
        }));
        
        setAiSuggestions(suggestions);
        return suggestions;
      } catch (error) {
        console.error('Error fetching hotel suggestions:', error);
        
        // Fallback to backend API if Google Places fails
        const response = await apiRequest("/api/accommodations/suggestions", {
          method: "POST",
          body: {
            destination: selectedTripData.destination,
            checkIn: selectedTripData.startDate,
            checkOut: selectedTripData.endDate,
            budget: selectedTripData.budget,
            preferences: selectedTripData.preferences,
          },
        });
        return response;
      }
    },
    onSuccess: async (result) => {
      if (Array.isArray(result)) {
        setAiSuggestions(result);
        toast({
          title: "Sugestões geradas!",
          description: "Encontramos hotéis reais usando Google Places API.",
        });
      } else if (result) {
        const data = await result.json();
        if (data?.suggestions) {
          setAiSuggestions(data.suggestions);
          toast({
            title: "Sugestões geradas!",
            description: "A IA encontrou ótimas opções de hospedagem para você.",
          });
        }
      }
      setIsGeneratingSuggestions(false);
    },
    onError: () => {
      toast({
        title: "Erro ao gerar sugestões",
        description: "Verifique se a chave da API do Google Places está configurada.",
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

  const handleHotelSave = async (hotel: HotelRecommendation) => {
    try {
      await apiRequest("/api/accommodations", {
        method: "POST",
        body: {
          tripId: selectedTrip,
          name: hotel.name,
          address: hotel.address,
          city: hotel.vicinity,
          checkIn: selectedTripData?.startDate,
          checkOut: selectedTripData?.endDate,
          type: "suggestion",
          price: hotel.priceRange,
          contactInfo: `Place ID: ${hotel.id}`,
          amenities: hotel.amenities,
          checkInTime: "15:00",
          checkOutTime: "11:00",
        },
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTrip, "accommodations"] });
      
      toast({
        title: "Hotel salvo!",
        description: `${hotel.name} foi adicionado à sua viagem.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar hotel",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
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
            <button
              onClick={() => setActiveTab("ai-recommendations")}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === "ai-recommendations"
                  ? "text-white bg-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/20"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Recomendações Inteligentes</span>
            </button>
            <button
              onClick={() => setActiveTab("itinerary-based")}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                activeTab === "itinerary-based"
                  ? "text-white bg-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/20"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Baseado no Cronograma</span>
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

          {/* AI Recommendations */}
          {activeTab === "ai-recommendations" && (
            <HotelRecommendationPanel 
              selectedTrip={selectedTripData} 
              onHotelSave={handleHotelSave}
            />
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

          {/* Itinerary-Based Recommendations */}
          {activeTab === "itinerary-based" && (
            <ItineraryHotelRecommendations 
              tripId={selectedTrip} 
              trip={selectedTripData}
            />
          )}
        </div>
      )}
    </div>
  );
}