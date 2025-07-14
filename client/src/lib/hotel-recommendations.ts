import { googlePlaces, searchHotelsInDestination } from './google-places';
import { hotelSearchService } from './hotel-search-service';
import { apiRequest } from './queryClient';

export interface HotelRecommendation {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  priceRange: string;
  vicinity: string;
  photos: string[];
  amenities: string[];
  proximityScore: number;
  budgetMatch: boolean;
  aiRecommendationReason: string;
  distanceToAttractions: Array<{
    attraction: string;
    distance: string;
    walkTime: string;
  }>;
  bookingUrl?: string;
  reviewsCount: number;
  highlights: string[];
}

export interface RecommendationCriteria {
  destination: string;
  budget: string;
  travelStyle: string[];
  preferences: string;
  itineraryLocations: string[];
  checkIn: string;
  checkOut: string;
  travelers: number;
}

export class HotelRecommendationEngine {
  private async getLocationCoordinates(location: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
      );
      const data = await geocodeResponse.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  private calculateProximityScore(hotel: any, itineraryLocations: string[]): number {
    const hotelLocation = hotel.vicinity || hotel.formatted_address;
    let score = 0;
    
    itineraryLocations.forEach(location => {
      const locationLower = location.toLowerCase();
      const hotelLocationLower = hotelLocation.toLowerCase();
      
      // Direct location match
      if (hotelLocationLower.includes(locationLower) || locationLower.includes(hotelLocationLower)) {
        score += 20;
      }
      
      // Neighborhood proximity keywords
      const proximityKeywords = {
        'copacabana': ['copacabana', 'leme', 'ipanema'],
        'ipanema': ['ipanema', 'copacabana', 'leblon'],
        'leblon': ['leblon', 'ipanema', 'gávea'],
        'urca': ['urca', 'botafogo', 'flamengo'],
        'corcovado': ['cosme velho', 'laranjeiras', 'tijuca'],
        'centro': ['centro', 'lapa', 'cinelândia'],
        'barra': ['barra', 'recreio', 'jacarepaguá']
      };
      
      Object.entries(proximityKeywords).forEach(([area, keywords]) => {
        if (locationLower.includes(area)) {
          keywords.forEach(keyword => {
            if (hotelLocationLower.includes(keyword)) {
              score += 15;
            }
          });
        }
      });
    });
    
    return Math.min(score, 100); // Cap at 100
  }

  private getBudgetLevel(budget: string): number {
    const budgetNum = parseInt(budget) || 0;
    if (budgetNum < 800) return 1;   // Budget: R$ 80-150/night
    if (budgetNum < 2000) return 2;  // Mid-range: R$ 150-300/night
    if (budgetNum < 4000) return 3;  // Upscale: R$ 300-500/night
    return 4; // Luxury: R$ 500+/night
  }

  private getPriceRange(priceLevel: number): string {
    const ranges = {
      1: "R$ 80-150/noite",
      2: "R$ 150-300/noite", 
      3: "R$ 300-500/noite",
      4: "R$ 500+/noite"
    };
    return ranges[priceLevel as keyof typeof ranges] || "Consultar preços";
  }

  private getAmenitiesFromTypes(types: string[], travelStyle: string[]): string[] {
    const amenities = ["Wi-Fi gratuito", "Ar condicionado"];
    
    // Type-based amenities
    if (types.includes('spa')) amenities.push("Spa");
    if (types.includes('gym')) amenities.push("Academia");
    if (types.includes('restaurant')) amenities.push("Restaurante");
    if (types.includes('bar')) amenities.push("Bar");
    if (types.includes('lodging')) amenities.push("Estacionamento");
    if (types.includes('swimming_pool')) amenities.push("Piscina");
    if (types.includes('business_center')) amenities.push("Centro de negócios");
    
    // Travel style-based amenities
    if (travelStyle.includes('luxury')) {
      amenities.push("Concierge", "Room service", "Serviço de quarto");
    }
    if (travelStyle.includes('business')) {
      amenities.push("Centro de negócios", "Sala de reuniões");
    }
    if (travelStyle.includes('family')) {
      amenities.push("Piscina", "Área infantil");
    }
    if (travelStyle.includes('romantic')) {
      amenities.push("Spa", "Jantar romântico");
    }
    
    return [...new Set(amenities)].slice(0, 6);
  }

  private async generateAIRecommendationReason(hotel: any, criteria: RecommendationCriteria): Promise<string> {
    const reasons = [];
    
    // Budget matching
    const budgetLevel = this.getBudgetLevel(criteria.budget);
    const hotelPriceLevel = hotel.price_level || 2;
    
    if (hotelPriceLevel <= budgetLevel) {
      reasons.push("Dentro do seu orçamento");
    }
    
    // Location proximity
    const proximityScore = this.calculateProximityScore(hotel, criteria.itineraryLocations);
    if (proximityScore > 30) {
      reasons.push("Próximo aos seus pontos de interesse");
    }
    
    // Rating
    if (hotel.rating >= 4.5) {
      reasons.push("Excelente avaliação dos hóspedes");
    } else if (hotel.rating >= 4.0) {
      reasons.push("Boa avaliação dos hóspedes");
    }
    
    // Travel style matching
    if (criteria.travelStyle.includes('luxury') && hotelPriceLevel >= 3) {
      reasons.push("Padrão de luxo compatível com seu estilo");
    }
    if (criteria.travelStyle.includes('cultural') && hotel.types.includes('lodging')) {
      reasons.push("Localização ideal para explorar a cultura local");
    }
    
    return reasons.length > 0 ? reasons.join(", ") : "Boa opção para sua viagem";
  }

  private async calculateDistanceToAttractions(hotel: any, itineraryLocations: string[]): Promise<Array<{
    attraction: string;
    distance: string;
    walkTime: string;
  }>> {
    const distances = [];
    
    // Simplified distance calculation based on known Rio locations
    const rioBounds = {
      'copacabana': { lat: -22.9711, lng: -43.1822 },
      'ipanema': { lat: -22.9868, lng: -43.2057 },
      'corcovado': { lat: -22.9519, lng: -43.2105 },
      'urca': { lat: -22.9483, lng: -43.1656 },
      'centro': { lat: -22.9035, lng: -43.2096 }
    };
    
    for (const location of itineraryLocations) {
      const locationKey = location.toLowerCase();
      let distance = "Calculando...";
      let walkTime = "Calculando...";
      
      // Estimate distances for common Rio locations
      if (locationKey.includes('copacabana')) {
        distance = "0.5-2 km";
        walkTime = "5-20 min";
      } else if (locationKey.includes('ipanema')) {
        distance = "1-3 km";
        walkTime = "10-30 min";
      } else if (locationKey.includes('corcovado')) {
        distance = "5-15 km";
        walkTime = "Transporte necessário";
      } else if (locationKey.includes('urca')) {
        distance = "2-8 km";
        walkTime = "20-40 min";
      }
      
      distances.push({
        attraction: location,
        distance,
        walkTime
      });
    }
    
    return distances;
  }

  async getRecommendations(criteria: RecommendationCriteria): Promise<HotelRecommendation[]> {
    try {
      console.log('Getting hotel recommendations for:', criteria.destination);
      
      // Use the improved hotel search service
      const hotels = await hotelSearchService.searchHotels(criteria.destination);
      console.log('Hotels found:', hotels.length);
      
      if (hotels.length === 0) {
        console.log('No hotels found - this should not happen with fallbacks');
        return [];
      }
      
      // Convert to hotel recommendations
      const recommendations = hotels.slice(0, 8).map(hotel => {
        return hotelSearchService.convertToHotelRecommendation(hotel, criteria);
      });
      
      // Sort by proximity score and budget match
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          if (a.budgetMatch && !b.budgetMatch) return -1;
          if (!a.budgetMatch && b.budgetMatch) return 1;
          return b.proximityScore - a.proximityScore;
        })
        .slice(0, 6);
      
      console.log('Final hotel recommendations:', sortedRecommendations.length);
      return sortedRecommendations;
    } catch (error) {
      console.error('Error generating hotel recommendations:', error);
      return [];
    }
  }

  private generateHighlights(hotel: any, proximityScore: number, budgetMatch: boolean): string[] {
    const highlights = [];
    
    if (hotel.rating >= 4.5) highlights.push("Excelente avaliação");
    if (proximityScore > 30) highlights.push("Localização privilegiada");
    if (budgetMatch) highlights.push("Dentro do orçamento");
    if (hotel.user_ratings_total > 500) highlights.push("Muito bem avaliado");
    if (hotel.price_level >= 3) highlights.push("Padrão superior");
    
    return highlights;
  }
}

export const hotelRecommendationEngine = new HotelRecommendationEngine();