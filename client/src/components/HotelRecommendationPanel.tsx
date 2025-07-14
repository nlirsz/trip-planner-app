import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from './GlassCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { HotelRecommendationCard } from './HotelRecommendationCard';
import { Sparkles, MapPin, Filter, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { hotelRecommendationEngine, HotelRecommendation, RecommendationCriteria } from '@/lib/hotel-recommendations';

interface HotelRecommendationPanelProps {
  selectedTrip: any;
  onHotelSave: (hotel: HotelRecommendation) => void;
}

export function HotelRecommendationPanel({ selectedTrip, onHotelSave }: HotelRecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<HotelRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterBudget, setFilterBudget] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterProximity, setFilterProximity] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const { toast } = useToast();

  // Get itinerary data for the selected trip
  const { data: itineraryItems = [] } = useQuery({
    queryKey: ['/api/trips', selectedTrip?.id, 'itinerary'],
    enabled: !!selectedTrip?.id,
  });

  const generateRecommendations = async () => {
    if (!selectedTrip) return;
    
    setIsGenerating(true);
    try {
      const itineraryLocations = [...new Set(itineraryItems.map((item: any) => item.location))];
      
      const criteria: RecommendationCriteria = {
        destination: selectedTrip.destination,
        budget: selectedTrip.budget,
        travelStyle: selectedTrip.travelStyle || [],
        preferences: selectedTrip.preferences || '',
        itineraryLocations,
        checkIn: selectedTrip.startDate,
        checkOut: selectedTrip.endDate,
        travelers: 2
      };

      const newRecommendations = await hotelRecommendationEngine.getRecommendations(criteria);
      
      setRecommendations(newRecommendations);
      
      toast({
        title: "Recomendações geradas!",
        description: `Encontramos ${newRecommendations.length} hotéis inteligentes para sua viagem.`,
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Erro ao gerar recomendações",
        description: "Verifique se a API do Google Places está configurada.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(hotel => {
      if (filterBudget !== 'all' && hotel.priceLevel !== parseInt(filterBudget)) return false;
      if (filterRating !== 'all' && hotel.rating < parseFloat(filterRating)) return false;
      if (filterProximity !== 'all' && hotel.proximityScore < parseInt(filterProximity)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.priceLevel - b.priceLevel;
        case 'rating':
          return b.rating - a.rating;
        case 'proximity':
          return b.proximityScore - a.proximityScore;
        default:
          return (b.rating * 20 + b.proximityScore) - (a.rating * 20 + a.proximityScore);
      }
    });

  const handleHotelBook = (hotel: HotelRecommendation) => {
    // Open booking link or navigate to booking page
    window.open(`https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name)}`, '_blank');
  };

  const handleSaveToTrip = (hotel: HotelRecommendation) => {
    onHotelSave(hotel);
    toast({
      title: "Hotel salvo!",
      description: `${hotel.name} foi adicionado à sua viagem.`,
    });
  };

  if (!selectedTrip) {
    return (
      <GlassCard className="p-8 text-center">
        <MapPin className="w-16 h-16 text-white/60 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Selecione uma viagem</h3>
        <p className="text-white/80">Escolha uma viagem para ver recomendações inteligentes de hotéis</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Recomendações Inteligentes
          </h2>
          <p className="text-white/80">
            Hotéis personalizados baseados no seu itinerário e preferências
          </p>
        </div>
        <Button 
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Recomendações
            </>
          )}
        </Button>
      </div>

      {/* Trip Info */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <Label className="text-white/80">Destino</Label>
            <p className="text-white font-medium">{selectedTrip.destination}</p>
          </div>
          <div>
            <Label className="text-white/80">Orçamento</Label>
            <p className="text-white font-medium">R$ {selectedTrip.budget}</p>
          </div>
          <div>
            <Label className="text-white/80">Estilo</Label>
            <div className="flex gap-1">
              {selectedTrip.travelStyle?.map((style: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-white/80">Locais do Itinerário</Label>
            <p className="text-white font-medium text-xs">
              {[...new Set(itineraryItems.map((item: any) => item.location))].join(', ')}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Filters and Sort */}
      {recommendations.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white" />
              <Label className="text-white">Filtros:</Label>
            </div>
            
            <Select value={filterBudget} onValueChange={setFilterBudget}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Orçamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">Econômico</SelectItem>
                <SelectItem value="2">Médio</SelectItem>
                <SelectItem value="3">Superior</SelectItem>
                <SelectItem value="4">Luxo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="4.5">4.5+ estrelas</SelectItem>
                <SelectItem value="4.0">4.0+ estrelas</SelectItem>
                <SelectItem value="3.5">3.5+ estrelas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProximity} onValueChange={setFilterProximity}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Proximidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="40">Muito próximo</SelectItem>
                <SelectItem value="20">Próximo</SelectItem>
                <SelectItem value="0">Qualquer</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <Label className="text-white">Ordenar por:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Melhor match</SelectItem>
                  <SelectItem value="price">Preço</SelectItem>
                  <SelectItem value="rating">Avaliação</SelectItem>
                  <SelectItem value="proximity">Proximidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {filteredRecommendations.length} recomendações encontradas
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <TrendingUp className="w-4 h-4" />
              <span>Ordenado por {sortBy === 'score' ? 'melhor combinação' : sortBy}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((hotel) => (
              <HotelRecommendationCard
                key={hotel.id}
                hotel={hotel}
                onBook={handleHotelBook}
                onSaveToTrip={handleSaveToTrip}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recommendations.length === 0 && !isGenerating && (
        <GlassCard className="p-8 text-center">
          <Sparkles className="w-16 h-16 text-white/60 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Pronto para encontrar o hotel perfeito?</h3>
          <p className="text-white/80 mb-4">
            Nossa IA analisará seu itinerário, orçamento e preferências para recomendar os melhores hotéis
          </p>
          <Button 
            onClick={generateRecommendations}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Recomendações
          </Button>
        </GlassCard>
      )}
    </div>
  );
}