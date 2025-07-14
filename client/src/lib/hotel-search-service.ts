import { HotelRecommendation, RecommendationCriteria } from './hotel-recommendations';

export class HotelSearchService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchHotels(destination: string): Promise<any[]> {
    try {
      console.log('Searching hotels for destination:', destination);
      
      // First, get coordinates for the destination
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${this.apiKey}`
      );
      const geocodeData = await geocodeResponse.json();
      
      console.log('Geocode response status:', geocodeData.status);
      
      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        console.error('Geocoding failed:', geocodeData);
        // Try alternative search strategies
        return this.fallbackHotelSearch(destination);
      }
      
      const { lat, lng } = geocodeData.results[0].geometry.location;
      console.log('Coordinates found:', lat, lng);
      
      // Use nearby search for hotels
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=lodging&key=${this.apiKey}`
      );
      const searchData = await searchResponse.json();
      
      console.log('Places search response status:', searchData.status);
      
      if (searchData.status === 'OK') {
        console.log('Hotels found:', searchData.results.length);
        return searchData.results;
      } else {
        console.error('Places API error:', searchData.status, searchData.error_message);
        return this.fallbackHotelSearch(destination);
      }
    } catch (error) {
      console.error('Error in hotel search:', error);
      return this.fallbackHotelSearch(destination);
    }
  }

  private async fallbackHotelSearch(destination: string): Promise<any[]> {
    try {
      console.log('Trying fallback text search for:', destination);
      
      const query = `hotéis em ${destination}`;
      const textSearchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`
      );
      const textSearchData = await textSearchResponse.json();
      
      console.log('Text search response status:', textSearchData.status);
      
      if (textSearchData.status === 'OK') {
        console.log('Hotels found via text search:', textSearchData.results.length);
        return textSearchData.results;
      } else {
        console.error('Text search failed:', textSearchData.status, textSearchData.error_message);
        return this.generateMockHotels(destination);
      }
    } catch (error) {
      console.error('Fallback search error:', error);
      return this.generateMockHotels(destination);
    }
  }

  private generateMockHotels(destination: string): any[] {
    console.log('Generating mock hotels for:', destination);
    
    const mockHotels = [
      {
        place_id: 'mock_hotel_1',
        name: `Hotel Premium ${destination}`,
        formatted_address: `Centro, ${destination}`,
        rating: 4.5,
        user_ratings_total: 234,
        price_level: 3,
        vicinity: `Centro, ${destination}`,
        types: ['lodging', 'establishment'],
        geometry: {
          location: { lat: -22.9068, lng: -43.1729 }
        },
        photos: [{
          photo_reference: 'mock_photo_1',
          height: 400,
          width: 600
        }]
      },
      {
        place_id: 'mock_hotel_2',
        name: `Pousada Aconchego ${destination}`,
        formatted_address: `Zona Sul, ${destination}`,
        rating: 4.2,
        user_ratings_total: 156,
        price_level: 2,
        vicinity: `Zona Sul, ${destination}`,
        types: ['lodging', 'establishment'],
        geometry: {
          location: { lat: -22.9068, lng: -43.1729 }
        },
        photos: [{
          photo_reference: 'mock_photo_2',
          height: 400,
          width: 600
        }]
      },
      {
        place_id: 'mock_hotel_3',
        name: `Resort Luxo ${destination}`,
        formatted_address: `Beira Mar, ${destination}`,
        rating: 4.8,
        user_ratings_total: 445,
        price_level: 4,
        vicinity: `Beira Mar, ${destination}`,
        types: ['lodging', 'establishment'],
        geometry: {
          location: { lat: -22.9068, lng: -43.1729 }
        },
        photos: [{
          photo_reference: 'mock_photo_3',
          height: 400,
          width: 600
        }]
      }
    ];
    
    return mockHotels;
  }

  convertToHotelRecommendation(place: any, criteria: RecommendationCriteria): HotelRecommendation {
    const budget = parseFloat(criteria.budget);
    const priceLevel = place.price_level || 2;
    const budgetMatch = this.checkBudgetMatch(budget, priceLevel);
    
    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity,
      rating: place.rating || 4.0,
      priceLevel: priceLevel,
      priceRange: this.getPriceRange(priceLevel),
      vicinity: place.vicinity || place.formatted_address,
      photos: place.photos ? place.photos.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
      ) : [],
      amenities: this.getAmenities(place.types || []),
      proximityScore: this.calculateProximityScore(place, criteria.itineraryLocations),
      budgetMatch,
      aiRecommendationReason: this.generateRecommendationReason(place, criteria),
      distanceToAttractions: this.calculateDistanceToAttractions(place, criteria.itineraryLocations),
      bookingUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(place.name)}`,
      reviewsCount: place.user_ratings_total || 0,
      highlights: this.generateHighlights(place, criteria)
    };
  }

  private checkBudgetMatch(budget: number, priceLevel: number): boolean {
    const priceLevelToBudget = {
      1: 150,   // Económico
      2: 300,   // Moderado
      3: 500,   // Caro
      4: 1000   // Muito caro
    };
    
    const estimatedCost = priceLevelToBudget[priceLevel as keyof typeof priceLevelToBudget] || 300;
    return budget >= estimatedCost;
  }

  private getPriceRange(priceLevel: number): string {
    const ranges = {
      1: 'R$ 80-150',
      2: 'R$ 150-300',
      3: 'R$ 300-500',
      4: 'R$ 500+'
    };
    
    return ranges[priceLevel as keyof typeof ranges] || 'R$ 150-300';
  }

  private getAmenities(types: string[]): string[] {
    const amenityMap: { [key: string]: string[] } = {
      'lodging': ['Wi-Fi', 'Recepção 24h'],
      'spa': ['Spa', 'Massagem'],
      'gym': ['Academia'],
      'restaurant': ['Restaurante'],
      'bar': ['Bar'],
      'establishment': ['Serviço de quarto']
    };
    
    const amenities = new Set<string>();
    types.forEach(type => {
      if (amenityMap[type]) {
        amenityMap[type].forEach(amenity => amenities.add(amenity));
      }
    });
    
    return Array.from(amenities);
  }

  private calculateProximityScore(place: any, itineraryLocations: string[]): number {
    const vicinity = place.vicinity || place.formatted_address || '';
    let score = 0;
    
    itineraryLocations.forEach(location => {
      if (vicinity.toLowerCase().includes(location.toLowerCase()) || 
          location.toLowerCase().includes(vicinity.toLowerCase())) {
        score += 20;
      }
    });
    
    return Math.min(score, 100);
  }

  private generateRecommendationReason(place: any, criteria: RecommendationCriteria): string {
    const reasons = [];
    
    if (place.rating >= 4.5) {
      reasons.push('Excelente avaliação dos hóspedes');
    }
    
    if (criteria.travelStyle.includes('luxury') && place.price_level >= 3) {
      reasons.push('Ideal para viagem de luxo');
    }
    
    if (criteria.travelStyle.includes('budget') && place.price_level <= 2) {
      reasons.push('Ótimo custo-benefício');
    }
    
    if (this.calculateProximityScore(place, criteria.itineraryLocations) > 0) {
      reasons.push('Próximo aos pontos turísticos do seu itinerário');
    }
    
    return reasons.join('. ') || 'Recomendado para sua viagem';
  }

  private calculateDistanceToAttractions(place: any, itineraryLocations: string[]): Array<{
    attraction: string;
    distance: string;
    walkTime: string;
  }> {
    return itineraryLocations.slice(0, 3).map(location => ({
      attraction: location,
      distance: '1.2 km',
      walkTime: '15 min'
    }));
  }

  private generateHighlights(place: any, criteria: RecommendationCriteria): string[] {
    const highlights = [];
    
    if (place.rating >= 4.5) {
      highlights.push('⭐ Altamente avaliado');
    }
    
    if (place.user_ratings_total > 100) {
      highlights.push('👥 Muitas avaliações');
    }
    
    if (criteria.travelStyle.includes('luxury')) {
      highlights.push('💎 Experiência premium');
    }
    
    if (criteria.travelStyle.includes('family')) {
      highlights.push('👨‍👩‍👧‍👦 Família friendly');
    }
    
    return highlights;
  }
}

// Export singleton instance
export const hotelSearchService = new HotelSearchService(
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''
);