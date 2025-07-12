// Google Maps Integration for Location Services
export interface MapConfig {
  apiKey: string;
  defaultCenter?: {
    lat: number;
    lng: number;
  };
  defaultZoom?: number;
}

export interface GeocodeRequest {
  address: string;
  region?: string;
  language?: string;
}

export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  place_id: string;
  types: string[];
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
  result_type?: string[];
  location_type?: string[];
}

export interface DirectionsRequest {
  origin: string;
  destination: string;
  waypoints?: string[];
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  avoid?: 'tolls' | 'highways' | 'ferries' | 'indoor';
  language?: string;
  region?: string;
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      end_address: string;
      start_address: string;
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        polyline: { points: string };
        travel_mode: string;
      }>;
    }>;
    overview_polyline: { points: string };
    summary: string;
    warnings: string[];
    waypoint_order: number[];
  }>;
  status: string;
}

export interface DistanceMatrixRequest {
  origins: string[];
  destinations: string[];
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  region?: string;
  language?: string;
}

export interface DistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      status: string;
    }>;
  }>;
  origin_addresses: string[];
  destination_addresses: string[];
  status: string;
}

class GoogleMapsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';
  
  constructor(config: MapConfig) {
    this.apiKey = config.apiKey;
  }

  // Geocode an address to get coordinates
  async geocode(request: GeocodeRequest): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({
      address: request.address,
      key: this.apiKey,
      language: request.language || 'pt-BR',
      ...(request.region && { region: request.region }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        throw new Error(`Geocoding Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  // Reverse geocode coordinates to get address
  async reverseGeocode(request: ReverseGeocodeRequest): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({
      latlng: `${request.lat},${request.lng}`,
      key: this.apiKey,
      language: 'pt-BR',
      ...(request.result_type && { result_type: request.result_type.join('|') }),
      ...(request.location_type && { location_type: request.location_type.join('|') }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results;
      } else {
        throw new Error(`Reverse Geocoding Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  // Get directions between two points
  async getDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    const params = new URLSearchParams({
      origin: request.origin,
      destination: request.destination,
      key: this.apiKey,
      language: request.language || 'pt-BR',
      region: request.region || 'BR',
      mode: request.travelMode || 'DRIVING',
      ...(request.waypoints && { waypoints: request.waypoints.join('|') }),
      ...(request.avoid && { avoid: request.avoid }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/directions/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data;
      } else {
        throw new Error(`Directions Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  // Get distance matrix between multiple origins and destinations
  async getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResult> {
    const params = new URLSearchParams({
      origins: request.origins.join('|'),
      destinations: request.destinations.join('|'),
      key: this.apiKey,
      language: request.language || 'pt-BR',
      region: request.region || 'BR',
      mode: request.travelMode || 'DRIVING',
      ...(request.avoidHighways && { avoid: 'highways' }),
      ...(request.avoidTolls && { avoid: 'tolls' }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/distancematrix/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data;
      } else {
        throw new Error(`Distance Matrix Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  // Get static map URL
  getStaticMapUrl(params: {
    center?: string;
    zoom?: number;
    size?: string;
    markers?: string[];
    maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
    style?: string;
  }): string {
    const urlParams = new URLSearchParams({
      key: this.apiKey,
      center: params.center || '0,0',
      zoom: (params.zoom || 10).toString(),
      size: params.size || '600x400',
      maptype: params.maptype || 'roadmap',
      ...(params.markers && { markers: params.markers.join('|') }),
      ...(params.style && { style: params.style }),
    });

    return `${this.baseUrl}/staticmap?${urlParams}`;
  }

  // Get timezone information for a location
  async getTimezone(lat: number, lng: number, timestamp?: number): Promise<any> {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
      key: this.apiKey,
    });

    try {
      const response = await fetch(`${this.baseUrl}/timezone/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data;
      } else {
        throw new Error(`Timezone Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting timezone:', error);
      throw error;
    }
  }

  // Get elevation data for locations
  async getElevation(locations: Array<{ lat: number; lng: number }>): Promise<any> {
    const params = new URLSearchParams({
      locations: locations.map(loc => `${loc.lat},${loc.lng}`).join('|'),
      key: this.apiKey,
    });

    try {
      const response = await fetch(`${this.baseUrl}/elevation/json?${params}`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data;
      } else {
        throw new Error(`Elevation Error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error getting elevation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleMaps = new GoogleMapsService({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
});

// Helper functions
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    const results = await googleMaps.geocode({ address });
    return results[0] || null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
};

export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const results = await googleMaps.reverseGeocode({ lat, lng });
    return results[0]?.formatted_address || null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};

export const getDistanceBetweenPoints = async (
  origin: string,
  destination: string
): Promise<{ distance: string; duration: string } | null> => {
  try {
    const result = await googleMaps.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
    });
    
    const element = result.rows[0]?.elements[0];
    if (element && element.status === 'OK') {
      return {
        distance: element.distance.text,
        duration: element.duration.text,
      };
    }
    return null;
  } catch (error) {
    console.error('Distance calculation failed:', error);
    return null;
  }
};

export const getRouteDirections = async (
  origin: string,
  destination: string,
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING'
): Promise<DirectionsResult | null> => {
  try {
    return await googleMaps.getDirections({
      origin,
      destination,
      travelMode,
    });
  } catch (error) {
    console.error('Directions failed:', error);
    return null;
  }
};