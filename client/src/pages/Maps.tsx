import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Clock, Car, Route, Search, Loader2 } from "lucide-react";
import { 
  googleMaps, 
  geocodeAddress, 
  getAddressFromCoordinates, 
  getDistanceBetweenPoints, 
  getRouteDirections 
} from "@/lib/google-maps";
import { 
  googlePlaces, 
  searchHotelsInDestination, 
  searchRestaurantsNearLocation,
  searchPlacesByText 
} from "@/lib/google-places";

interface MapsProps {
  onNavigate: (section: string) => void;
}

export function Maps({ onNavigate }: MapsProps) {
  const [activeTab, setActiveTab] = useState<"places" | "maps" | "directions">("places");
  const [searchQuery, setSearchQuery] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [directionsResult, setDirectionsResult] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handlePlaceSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o que você está procurando.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlacesByText(searchQuery, userLocation);
      setSearchResults(results);
      toast({
        title: "Busca concluída!",
        description: `Encontramos ${results.length} lugares.`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Verifique se a chave da API está configurada.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDirectionsSearch = async () => {
    if (!origin.trim() || !destination.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha origem e destino.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const directions = await getRouteDirections(origin, destination);
      setDirectionsResult(directions);
      
      if (directions && directions.routes.length > 0) {
        const route = directions.routes[0];
        const leg = route.legs[0];
        toast({
          title: "Rota encontrada!",
          description: `Distância: ${leg.distance.text}, Tempo: ${leg.duration.text}`,
        });
      }
    } catch (error) {
      console.error("Directions error:", error);
      toast({
        title: "Erro na busca de rota",
        description: "Verifique se a chave da API está configurada.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleHotelSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o destino para buscar hotéis.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const hotels = await searchHotelsInDestination(searchQuery);
      setSearchResults(hotels);
      toast({
        title: "Hotéis encontrados!",
        description: `Encontramos ${hotels.length} hotéis em ${searchQuery}.`,
      });
    } catch (error) {
      console.error("Hotel search error:", error);
      toast({
        title: "Erro na busca de hotéis",
        description: "Verifique se a chave da API está configurada.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRestaurantSearch = async () => {
    if (!userLocation) {
      toast({
        title: "Localização necessária",
        description: "Permita o acesso à localização para buscar restaurantes próximos.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const restaurants = await searchRestaurantsNearLocation(userLocation.lat, userLocation.lng);
      setSearchResults(restaurants);
      toast({
        title: "Restaurantes encontrados!",
        description: `Encontramos ${restaurants.length} restaurantes próximos.`,
      });
    } catch (error) {
      console.error("Restaurant search error:", error);
      toast({
        title: "Erro na busca de restaurantes",
        description: "Verifique se a chave da API está configurada.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStaticMapUrl = (lat: number, lng: number) => {
    return googleMaps.getStaticMapUrl({
      center: `${lat},${lng}`,
      zoom: 15,
      size: "400x300",
      markers: [`color:red|${lat},${lng}`],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Google Maps APIs</h2>
        <p className="text-white/70">Demonstração das APIs do Google Maps integradas</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("places")}
          className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
            activeTab === "places"
              ? "text-white bg-white/20"
              : "text-white/70 hover:text-white hover:bg-white/20"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Places API</span>
        </button>
        <button
          onClick={() => setActiveTab("maps")}
          className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
            activeTab === "maps"
              ? "text-white bg-white/20"
              : "text-white/70 hover:text-white hover:bg-white/20"
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Maps API</span>
        </button>
        <button
          onClick={() => setActiveTab("directions")}
          className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
            activeTab === "directions"
              ? "text-white bg-white/20"
              : "text-white/70 hover:text-white hover:bg-white/20"
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Directions API</span>
        </button>
      </div>

      {/* Places API Tab */}
      {activeTab === "places" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Google Places API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="search-query" className="text-white mb-2 block">
                  Buscar lugares
                </Label>
                <Input
                  id="search-query"
                  type="text"
                  placeholder="Ex: restaurante italiano, hotel 5 estrelas"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  onClick={handlePlaceSearch}
                  disabled={isSearching}
                  className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Buscar Lugares
                </Button>
                <Button
                  onClick={handleHotelSearch}
                  disabled={isSearching}
                  className="bg-[#48BB78] hover:bg-[#48BB78]/90 text-white"
                >
                  Buscar Hotéis
                </Button>
                <Button
                  onClick={handleRestaurantSearch}
                  disabled={isSearching}
                  className="bg-[#F093FB] hover:bg-[#F093FB]/90 text-white"
                >
                  Restaurantes Próximos
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Resultados da Busca ({searchResults.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((place, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">{place.name}</h4>
                    <p className="text-sm text-white/80 mb-2">{place.formatted_address}</p>
                    
                    {place.rating && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                          ⭐ {place.rating}
                        </Badge>
                        {place.user_ratings_total && (
                          <span className="text-xs text-white/60">
                            ({place.user_ratings_total} avaliações)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {place.price_level && (
                      <Badge variant="outline" className="text-white/80 border-white/20">
                        {"$".repeat(place.price_level)} Preço
                      </Badge>
                    )}
                    
                    {place.types && place.types.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {place.types.slice(0, 2).map((type: string) => (
                          <Badge key={type} variant="secondary" className="text-xs bg-white/10 text-white/70">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Maps API Tab */}
      {activeTab === "maps" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Google Maps API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Sua Localização</h4>
                {userLocation ? (
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-white/80 mb-2">
                      Latitude: {userLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-white/80 mb-4">
                      Longitude: {userLocation.lng.toFixed(6)}
                    </p>
                    <img
                      src={getStaticMapUrl(userLocation.lat, userLocation.lng)}
                      alt="Mapa estático da sua localização"
                      className="w-full rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-white/80">
                      Permita o acesso à localização para ver o mapa.
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">Recursos Disponíveis</h4>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-lg p-3">
                    <Badge className="bg-[#667EEA]/20 text-[#667EEA] mb-2">Maps JavaScript API</Badge>
                    <p className="text-sm text-white/80">
                      Mapas interativos com marcadores e controles personalizados
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <Badge className="bg-[#48BB78]/20 text-[#48BB78] mb-2">Static Maps API</Badge>
                    <p className="text-sm text-white/80">
                      Imagens de mapas estáticos para visualização rápida
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <Badge className="bg-[#F093FB]/20 text-[#F093FB] mb-2">Geocoding API</Badge>
                    <p className="text-sm text-white/80">
                      Conversão entre endereços e coordenadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Directions API Tab */}
      {activeTab === "directions" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Google Directions API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="origin" className="text-white mb-2 block">
                  Origem
                </Label>
                <Input
                  id="origin"
                  type="text"
                  placeholder="Ex: São Paulo, SP"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
              <div>
                <Label htmlFor="destination" className="text-white mb-2 block">
                  Destino
                </Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="Ex: Rio de Janeiro, RJ"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
            </div>
            <Button
              onClick={handleDirectionsSearch}
              disabled={isSearching}
              className="bg-[#667EEA] hover:bg-[#667EEA]/90 text-white"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Route className="w-4 h-4 mr-2" />
              )}
              Calcular Rota
            </Button>
          </GlassCard>

          {/* Directions Results */}
          {directionsResult && directionsResult.routes.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Informações da Rota</h3>
              {directionsResult.routes.map((route: any, index: number) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-white mb-2">Rota {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Car className="w-5 h-5 text-[#667EEA]" />
                      <div>
                        <p className="text-sm text-white/80">Distância</p>
                        <p className="font-semibold text-white">
                          {route.legs[0].distance.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-[#48BB78]" />
                      <div>
                        <p className="text-sm text-white/80">Tempo</p>
                        <p className="font-semibold text-white">
                          {route.legs[0].duration.text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Route className="w-5 h-5 text-[#F093FB]" />
                      <div>
                        <p className="text-sm text-white/80">Resumo</p>
                        <p className="font-semibold text-white">
                          {route.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}