// Google Places API Integration for Real Hotel and Restaurant Data
export interface GooglePlacesConfig {
  apiKey: string;
  language?: string;
  region?: string;
}

export interface PlaceSearchRequest {
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
  types: string[];
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  openNow?: boolean;
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  vicinity: string;
  business_status?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  types: string[];
  url: string;
  vicinity: string;
}

class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  
  constructor(config: GooglePlacesConfig) {
    this.apiKey = config.apiKey;
  }

  // Search for nearby places (hotels, restaurants, etc.)
  async searchNearby(request: PlaceSearchRequest): Promise<PlaceResult[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${request.location.lat},${request.location.lng}`,
      radius: request.radius.toString(),
      type: request.types.join('|'),
      language: 'pt-BR',
      ...(request.keyword && { keyword: request.keyword }),
      ...(request.minPrice && { minprice: request.minPrice.toString() }),
      ...(request.maxPrice && { maxprice: request.maxPrice.toString() }),
      ...(request.openNow && { opennow: 'true' }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/nearbysearch/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        throw new Error(`Google Places API Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  // Get detailed information about a specific place
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const params = new URLSearchParams({
      key: this.apiKey,
      place_id: placeId,
      fields: 'place_id,name,formatted_address,international_phone_number,website,rating,user_ratings_total,price_level,opening_hours,photos,reviews,types,url,vicinity',
      language: 'pt-BR',
    });

    try {
      const response = await fetch(`${this.baseUrl}/details/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.result;
      } else {
        throw new Error(`Google Places API Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  // Get photo URL from photo reference
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  // Search for hotels in a specific destination
  async searchHotels(destination: string, checkIn?: string, checkOut?: string): Promise<PlaceResult[]> {
    // First, geocode the destination to get coordinates
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${this.apiKey}`
    );
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
      throw new Error('Could not find destination coordinates');
    }

    const location = geocodeData.results[0].geometry.location;
    
    return this.searchNearby({
      location: { lat: location.lat, lng: location.lng },
      radius: 50000, // 50km radius
      types: ['lodging'],
      keyword: 'hotel',
    });
  }

  // Search for restaurants in a specific area
  async searchRestaurants(location: { lat: number; lng: number }, radius: number = 5000): Promise<PlaceResult[]> {
    return this.searchNearby({
      location,
      radius,
      types: ['restaurant'],
    });
  }

  // Search for tourist attractions
  async searchAttractions(location: { lat: number; lng: number }, radius: number = 10000): Promise<PlaceResult[]> {
    return this.searchNearby({
      location,
      radius,
      types: ['tourist_attraction', 'museum', 'amusement_park'],
    });
  }

  // Search for specific type of places with text query
  async textSearch(query: string, location?: { lat: number; lng: number }, radius?: number): Promise<PlaceResult[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      query,
      language: 'pt-BR',
      ...(location && { location: `${location.lat},${location.lng}` }),
      ...(radius && { radius: radius.toString() }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/textsearch/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        throw new Error(`Google Places API Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error in text search:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googlePlaces = new GooglePlacesService({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
});

// Helper functions for common searches
export const searchHotelsInDestination = async (destination: string) => {
  return await googlePlaces.searchHotels(destination);
};

export const searchRestaurantsNearLocation = async (lat: number, lng: number) => {
  return await googlePlaces.searchRestaurants({ lat, lng });
};

export const getPlaceDetailsById = async (placeId: string) => {
  return await googlePlaces.getPlaceDetails(placeId);
};

export const searchPlacesByText = async (query: string, location?: { lat: number; lng: number }) => {
  return await googlePlaces.textSearch(query, location);
};