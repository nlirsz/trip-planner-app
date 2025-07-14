import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Star, MapPin, Clock, Wifi, Car, Coffee, Dumbbell, Utensils, Heart, Eye, ExternalLink } from 'lucide-react';
import { HotelRecommendation } from '../lib/hotel-recommendations';

interface HotelRecommendationCardProps {
  hotel: HotelRecommendation;
  onBook: (hotel: HotelRecommendation) => void;
  onSaveToTrip: (hotel: HotelRecommendation) => void;
}

export function HotelRecommendationCard({ hotel, onBook, onSaveToTrip }: HotelRecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wi-fi')) return <Wifi className="w-4 h-4" />;
    if (amenityLower.includes('estacionamento') || amenityLower.includes('parking')) return <Car className="w-4 h-4" />;
    if (amenityLower.includes('café') || amenityLower.includes('breakfast')) return <Coffee className="w-4 h-4" />;
    if (amenityLower.includes('academia') || amenityLower.includes('gym')) return <Dumbbell className="w-4 h-4" />;
    if (amenityLower.includes('restaurante') || amenityLower.includes('restaurant')) return <Utensils className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  const getProximityColor = (score: number) => {
    if (score >= 40) return 'bg-green-500';
    if (score >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPhotoUrl = (photoReference: string) => {
    if (!photoReference) return '/placeholder-hotel.jpg';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;
  };

  return (
    <GlassCard className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative">
        {/* Hotel Image */}
        <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-500 relative overflow-hidden">
          {hotel.photos.length > 0 ? (
            <img 
              src={getPhotoUrl(hotel.photos[0])} 
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-hotel.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/70" />
            </div>
          )}
          
          {/* Overlay with highlights */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {hotel.highlights.map((highlight, index) => (
              <Badge key={index} variant="secondary" className="bg-black/70 text-white text-xs">
                {highlight}
              </Badge>
            ))}
          </div>
          
          {/* Favorite button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          
          {/* Proximity indicator */}
          <div className="absolute bottom-3 left-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getProximityColor(hotel.proximityScore)}`}>
              {hotel.proximityScore >= 40 ? 'Muito próximo' : hotel.proximityScore >= 20 ? 'Próximo' : 'Distante'}
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{hotel.name}</h3>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{hotel.vicinity}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-white font-medium">{hotel.rating.toFixed(1)}</span>
              </div>
              <div className="text-xs text-white/60">
                {hotel.reviewsCount} avaliações
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="text-xl font-bold text-white">{hotel.priceRange}</div>
            {hotel.budgetMatch && (
              <Badge variant="outline" className="mt-1 text-green-400 border-green-400">
                Dentro do orçamento
              </Badge>
            )}
          </div>

          {/* AI Recommendation */}
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-xs font-medium text-blue-400 mb-1">IA Recomenda</div>
                <div className="text-sm text-white/90">{hotel.aiRecommendationReason}</div>
              </div>
            </div>
          </div>

          {/* Quick amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.slice(0, 4).map((amenity, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-white/80 bg-white/10 px-2 py-1 rounded">
                {getAmenityIcon(amenity)}
                <span>{amenity}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 text-white border-white/20 hover:bg-white/10">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{hotel.name}</DialogTitle>
                </DialogHeader>
                <HotelDetailsModal hotel={hotel} />
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => onSaveToTrip(hotel)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Salvar na viagem
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function HotelDetailsModal({ hotel }: { hotel: HotelRecommendation }) {
  const getPhotoUrl = (photoReference: string) => {
    if (!photoReference) return '/placeholder-hotel.jpg';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photoReference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`;
  };

  return (
    <div className="space-y-6">
      {/* Photo gallery */}
      {hotel.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {hotel.photos.slice(0, 4).map((photo, index) => (
            <img 
              key={index}
              src={getPhotoUrl(photo)} 
              alt={`${hotel.name} - ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-hotel.jpg';
              }}
            />
          ))}
        </div>
      )}

      {/* Hotel info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Informações</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{hotel.rating.toFixed(1)} estrelas ({hotel.reviewsCount} avaliações)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{hotel.address}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Preço</h4>
          <div className="text-lg font-bold text-green-600">{hotel.priceRange}</div>
          {hotel.budgetMatch && (
            <Badge variant="outline" className="mt-1 text-green-400 border-green-400">
              Dentro do orçamento
            </Badge>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h4 className="font-semibold mb-3">Comodidades</h4>
        <div className="grid grid-cols-2 gap-2">
          {hotel.amenities.map((amenity, index) => (
            <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
              <Star className="w-4 h-4 text-gray-500" />
              <span>{amenity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Distance to attractions */}
      <div>
        <h4 className="font-semibold mb-3">Distância para atrações</h4>
        <div className="space-y-2">
          {hotel.distanceToAttractions.map((attraction, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{attraction.attraction}</span>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{attraction.distance}</span>
                <Clock className="w-4 h-4" />
                <span>{attraction.walkTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Por que a IA recomenda este hotel
        </h4>
        <p className="text-sm text-gray-700">{hotel.aiRecommendationReason}</p>
      </div>
    </div>
  );
}