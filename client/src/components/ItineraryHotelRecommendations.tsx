import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { GlassCard } from './GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Star, Users, Wifi, Coffee, Dumbbell, Car, ExternalLink, Calendar } from 'lucide-react';

interface ItineraryHotelProps {
  tripId: number;
  trip: any;
}

interface CityHotelRecommendation {
  city: string;
  stayDuration: number;
  checkIn: string;
  checkOut: string;
  nearbyActivities: string[];
  hotels: any[];
  averageDistance: string;
  recommendedArea: string;
}

export function ItineraryHotelRecommendations({ tripId, trip }: ItineraryHotelProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data: cityRecommendationsData, isLoading, error } = useQuery({
    queryKey: [`/api/trips/${tripId}/itinerary-hotels`],
    queryFn: async () => {
      const response = await apiRequest(`/api/trips/${tripId}/itinerary-hotels`, {
        method: 'POST',
        body: {
          budget: trip.budget,
          travelStyle: trip.travelStyle,
          preferences: trip.preferences,
          travelers: 2
        }
      });
      return response.json();
    },
  });

  // Ensure we have a valid array
  const cityRecommendations = Array.isArray(cityRecommendationsData) ? cityRecommendationsData : [];
  
  // Debug logging
  console.log('Itinerary Hotel Recommendations - Raw data:', cityRecommendationsData);
  console.log('Itinerary Hotel Recommendations - Processed array:', cityRecommendations);

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'Wi-Fi': <Wifi className="w-4 h-4" />,
      'Café da manhã': <Coffee className="w-4 h-4" />,
      'Academia': <Dumbbell className="w-4 h-4" />,
      'Estacionamento': <Car className="w-4 h-4" />,
    };
    return iconMap[amenity] || <MapPin className="w-4 h-4" />;
  };

  const getPriceLevelColor = (priceLevel: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-red-100 text-red-800'
    };
    return colors[priceLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-white">Analisando seu roteiro para encontrar hotéis ideais...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    console.error('Error in itinerary hotel recommendations:', error);
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">
            <MapPin className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Erro ao carregar recomendações</h3>
          </div>
          <p className="text-white/80">
            Não foi possível gerar recomendações baseadas no roteiro. 
            Certifique-se de que você tem um itinerário criado.
          </p>
          <p className="text-red-300 text-sm mt-2">
            Erro: {error.message || 'Erro desconhecido'}
          </p>
        </div>
      </GlassCard>
    );
  }

  if (!cityRecommendations || cityRecommendations.length === 0) {
    console.log('No city recommendations found:', {
      cityRecommendationsData,
      cityRecommendations,
      isLoading,
      error
    });
    
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Primeiro, crie seu cronograma
          </h3>
          <p className="text-white/80">
            Para receber recomendações de hotéis baseadas no seu cronograma, 
            você precisa primeiro gerar um itinerário na aba "Cronograma".
          </p>
          <details className="mt-4 text-left">
            <summary className="text-sm text-white/60 cursor-pointer">Debug Info</summary>
            <pre className="text-xs text-white/50 mt-2 bg-black/20 p-2 rounded">
              {JSON.stringify({ cityRecommendationsData, cityRecommendations, isLoading, error }, null, 2)}
            </pre>
          </details>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">
          Hotéis Baseados no Seu Cronograma
        </h2>
      </div>

      {cityRecommendations.map((cityRec: CityHotelRecommendation, index: number) => (
        <GlassCard key={index} className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {cityRec.city}
              </h3>
              <Badge className="bg-blue-600 text-white">
                {cityRec.stayDuration} {cityRec.stayDuration === 1 ? 'dia' : 'dias'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Check-in: {new Date(cityRec.checkIn).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Distância média: {cityRec.averageDistance}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Área recomendada: {cityRec.recommendedArea}</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Próximo às suas atividades:</h4>
              <div className="flex flex-wrap gap-2">
                {cityRec.nearbyActivities.map((activity, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-white/10 border-white/20 text-white">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4">
            {cityRec.hotels.map((hotel: any, hotelIndex: number) => (
              <div key={hotelIndex} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white text-lg">{hotel.name}</h4>
                    <p className="text-white/70 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {hotel.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{hotel.rating}</span>
                      <span className="text-white/60 text-xs">({hotel.reviewsCount} avaliações)</span>
                    </div>
                    <Badge className={getPriceLevelColor(hotel.priceLevel)}>
                      {hotel.priceRange}
                    </Badge>
                  </div>
                </div>

                <p className="text-white/80 text-sm mb-3">{hotel.aiRecommendationReason}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">Comodidades:</h5>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 text-xs text-white/70">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">Distância das atrações:</h5>
                    <div className="space-y-1">
                      {hotel.distanceToAttractions.slice(0, 2).map((dist: any, idx: number) => (
                        <div key={idx} className="text-xs text-white/70">
                          {dist.attraction}: {dist.distance} ({dist.walkTime})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {hotel.highlights.map((highlight: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {highlight}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${hotel.budgetMatch ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span className="text-xs text-white/70">
                      {hotel.budgetMatch ? 'Dentro do orçamento' : 'Acima do orçamento'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.open(hotel.bookingUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}