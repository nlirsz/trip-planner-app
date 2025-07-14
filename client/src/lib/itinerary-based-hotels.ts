import { hotelSearchService } from './hotel-search-service';
import { HotelRecommendation, RecommendationCriteria } from './hotel-recommendations';
import { ItineraryItem } from '@shared/schema';

export interface CityHotelRecommendation {
  city: string;
  stayDuration: number; // days
  checkIn: string;
  checkOut: string;
  nearbyActivities: string[];
  hotels: HotelRecommendation[];
  averageDistance: string;
  recommendedArea: string;
}

export interface ItineraryBasedHotelRequest {
  itinerary: ItineraryItem[];
  budget: string;
  travelStyle: string[];
  preferences: string;
  travelers: number;
}

export class ItineraryBasedHotelService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateCityBasedRecommendations(request: ItineraryBasedHotelRequest): Promise<CityHotelRecommendation[]> {
    console.log('Generating city-based hotel recommendations for itinerary:', request.itinerary);
    
    // Group itinerary by city
    const citiesMap = this.groupItineraryByCities(request.itinerary);
    console.log('Cities found:', Object.keys(citiesMap));
    
    const recommendations: CityHotelRecommendation[] = [];
    
    for (const [city, cityData] of Object.entries(citiesMap)) {
      console.log(`Processing city: ${city}`);
      
      try {
        const cityRecommendation = await this.getCityHotelRecommendations(
          city,
          cityData,
          request
        );
        
        if (cityRecommendation) {
          recommendations.push(cityRecommendation);
        }
      } catch (error) {
        console.error(`Error processing city ${city}:`, error);
      }
    }
    
    return recommendations;
  }

  private groupItineraryByCities(itinerary: ItineraryItem[]): Record<string, {
    days: ItineraryItem[];
    activities: string[];
    checkIn: string;
    checkOut: string;
    duration: number;
  }> {
    const cities: Record<string, {
      days: ItineraryItem[];
      activities: string[];
      checkIn: string;
      checkOut: string;
      duration: number;
    }> = {};

    // Sort itinerary by date
    const sortedItinerary = [...itinerary].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const item of sortedItinerary) {
      const city = this.extractCityFromItem(item);
      
      if (!cities[city]) {
        cities[city] = {
          days: [],
          activities: [],
          checkIn: item.date,
          checkOut: item.date,
          duration: 0
        };
      }
      
      cities[city].days.push(item);
      cities[city].activities.push(...this.extractActivitiesFromItem(item));
      cities[city].checkOut = item.date;
      cities[city].duration = cities[city].days.length;
    }

    return cities;
  }

  private extractCityFromItem(item: ItineraryItem): string {
    // Extract city from the item's location or title
    const title = item.title || '';
    const location = item.location || '';
    const description = item.description || '';
    
    const text = `${title} ${location} ${description}`.toLowerCase();
    
    // Common city patterns
    const cityPatterns = [
      { pattern: /paris|pari/i, city: 'Paris' },
      { pattern: /london|londres/i, city: 'London' },
      { pattern: /rome|roma/i, city: 'Rome' },
      { pattern: /barcelona/i, city: 'Barcelona' },
      { pattern: /madrid/i, city: 'Madrid' },
      { pattern: /amsterdam/i, city: 'Amsterdam' },
      { pattern: /berlin|berlim/i, city: 'Berlin' },
      { pattern: /prague|praga/i, city: 'Prague' },
      { pattern: /vienna|viena/i, city: 'Vienna' },
      { pattern: /rio de janeiro|rio/i, city: 'Rio de Janeiro' },
      { pattern: /são paulo|sao paulo/i, city: 'São Paulo' },
      { pattern: /salvador/i, city: 'Salvador' },
      { pattern: /recife/i, city: 'Recife' },
      { pattern: /fortaleza/i, city: 'Fortaleza' },
      { pattern: /new york|nova york/i, city: 'New York' },
      { pattern: /los angeles/i, city: 'Los Angeles' },
      { pattern: /miami/i, city: 'Miami' },
      { pattern: /tokyo|tóquio/i, city: 'Tokyo' },
      { pattern: /kyoto|quioto/i, city: 'Kyoto' },
      { pattern: /osaka/i, city: 'Osaka' }
    ];

    for (const { pattern, city } of cityPatterns) {
      if (pattern.test(text)) {
        return city;
      }
    }

    // If no specific city found, try to extract from location
    if (location) {
      const locationParts = location.split(',');
      if (locationParts.length > 0) {
        return locationParts[0].trim();
      }
    }

    return 'Destino Principal';
  }

  private extractActivitiesFromItem(item: ItineraryItem): string[] {
    const activities = [];
    
    if (item.title) activities.push(item.title);
    if (item.location) activities.push(item.location);
    if (item.description) {
      // Extract key activities from description
      const description = item.description.toLowerCase();
      const activityKeywords = [
        'museu', 'museum', 'praia', 'beach', 'restaurante', 'restaurant',
        'parque', 'park', 'igreja', 'church', 'shopping', 'mercado', 'market',
        'teatro', 'theater', 'galeria', 'gallery', 'monumento', 'monument',
        'torre', 'tower', 'palácio', 'palace', 'castelo', 'castle'
      ];
      
      for (const keyword of activityKeywords) {
        if (description.includes(keyword)) {
          activities.push(keyword);
        }
      }
    }
    
    return activities;
  }

  private async getCityHotelRecommendations(
    city: string,
    cityData: any,
    request: ItineraryBasedHotelRequest
  ): Promise<CityHotelRecommendation | null> {
    try {
      console.log(`Searching hotels in ${city} for ${cityData.duration} days`);
      
      // Search for hotels in the city
      const hotels = await hotelSearchService.searchHotels(city);
      console.log(`Found ${hotels.length} hotels in ${city}`);
      
      if (hotels.length === 0) {
        console.log(`No hotels found for ${city}`);
        return null;
      }
      
      // Create criteria for this city
      const criteria: RecommendationCriteria = {
        destination: city,
        budget: request.budget,
        travelStyle: request.travelStyle,
        preferences: request.preferences,
        itineraryLocations: cityData.activities,
        checkIn: cityData.checkIn,
        checkOut: cityData.checkOut,
        travelers: request.travelers
      };
      
      // Convert to recommendations
      const recommendations = hotels.slice(0, 6).map(hotel => {
        return hotelSearchService.convertToHotelRecommendation(hotel, criteria);
      });
      
      // Sort by proximity and budget
      const sortedRecommendations = recommendations
        .sort((a, b) => {
          if (a.budgetMatch && !b.budgetMatch) return -1;
          if (!a.budgetMatch && b.budgetMatch) return 1;
          return b.proximityScore - a.proximityScore;
        })
        .slice(0, 4);
      
      // Calculate recommended area
      const recommendedArea = this.getRecommendedArea(city, cityData.activities);
      
      return {
        city,
        stayDuration: cityData.duration,
        checkIn: cityData.checkIn,
        checkOut: cityData.checkOut,
        nearbyActivities: cityData.activities.slice(0, 5),
        hotels: sortedRecommendations,
        averageDistance: this.calculateAverageDistance(sortedRecommendations),
        recommendedArea
      };
      
    } catch (error) {
      console.error(`Error getting recommendations for ${city}:`, error);
      return null;
    }
  }

  private getRecommendedArea(city: string, activities: string[]): string {
    const cityAreas: Record<string, Record<string, string>> = {
      'Paris': {
        'louvre': 'Marais/Châtelet',
        'eiffel': 'Champs-Élysées',
        'montmartre': 'Montmartre',
        'latin': 'Quartier Latin',
        'default': 'Centro de Paris'
      },
      'London': {
        'tower': 'City/Tower Bridge',
        'buckingham': 'Westminster',
        'covent': 'Covent Garden',
        'british': 'Bloomsbury',
        'default': 'Central London'
      },
      'Rio de Janeiro': {
        'copacabana': 'Copacabana',
        'ipanema': 'Ipanema',
        'corcovado': 'Cosme Velho',
        'centro': 'Centro',
        'default': 'Zona Sul'
      },
      'Rome': {
        'colosseum': 'Colosseo',
        'vatican': 'Vaticano',
        'trevi': 'Centro Histórico',
        'default': 'Centro de Roma'
      }
    };

    const cityAreaMap = cityAreas[city];
    if (!cityAreaMap) {
      return `Centro de ${city}`;
    }

    const activitiesText = activities.join(' ').toLowerCase();
    
    for (const [keyword, area] of Object.entries(cityAreaMap)) {
      if (keyword !== 'default' && activitiesText.includes(keyword)) {
        return area;
      }
    }
    
    return cityAreaMap.default;
  }

  private calculateAverageDistance(hotels: HotelRecommendation[]): string {
    if (hotels.length === 0) return 'N/A';
    
    const totalProximity = hotels.reduce((sum, hotel) => sum + hotel.proximityScore, 0);
    const avgProximity = totalProximity / hotels.length;
    
    if (avgProximity > 60) return '0.5-1 km';
    if (avgProximity > 30) return '1-2 km';
    if (avgProximity > 10) return '2-5 km';
    return '5+ km';
  }
}

// Export singleton instance
export const itineraryBasedHotelService = new ItineraryBasedHotelService(
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''
);