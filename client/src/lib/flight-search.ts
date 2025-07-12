// Flight Search Integration using SerpApi (Google Flights data)
export interface FlightSearchRequest {
  departure: string; // Airport code or city
  arrival: string; // Airport code or city
  departureDate: string; // YYYY-MM-DD format
  returnDate?: string; // YYYY-MM-DD format for round trip
  adults?: number;
  children?: number;
  infants?: number;
  currency?: string;
  language?: string;
  stops?: number; // 0 for nonstop, 1 for 1 stop, etc.
}

export interface FlightResult {
  flights: Array<{
    departure_airport: {
      name: string;
      id: string;
      time: string;
    };
    arrival_airport: {
      name: string;
      id: string;
      time: string;
    };
    duration: number; // in minutes
    airplane: string;
    airline: string;
    airline_logo: string;
    travel_class: string;
    flight_number: string;
    legroom: string;
    extensions: string[];
  }>;
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  carbon_emissions: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
}

export interface FlightSearchResponse {
  search_metadata: {
    status: string;
    created_at: string;
    processed_at: string;
  };
  search_parameters: {
    engine: string;
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
    return_date?: string;
    currency: string;
    language: string;
  };
  best_flights: FlightResult[];
  other_flights: FlightResult[];
  price_insights: {
    lowest_price: number;
    price_level: string;
    typical_price_range: [number, number];
    price_history: Array<{
      date: string;
      price: number;
    }>;
  };
}

class FlightSearchService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: this.apiKey,
      departure_id: request.departure,
      arrival_id: request.arrival,
      outbound_date: request.departureDate,
      currency: request.currency || 'BRL',
      hl: request.language || 'pt',
      adults: (request.adults || 1).toString(),
      ...(request.returnDate && { return_date: request.returnDate }),
      ...(request.children && { children: request.children.toString() }),
      ...(request.infants && { infants: request.infants.toString() }),
      ...(request.stops !== undefined && { stops: request.stops.toString() }),
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Flight Search Error: ${data.error}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  async getFlightInsights(departure: string, arrival: string, departureDate: string): Promise<any> {
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: this.apiKey,
      departure_id: departure,
      arrival_id: arrival,
      outbound_date: departureDate,
      currency: 'BRL',
      hl: 'pt',
      type: 'insights',
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching flight insights:', error);
      throw error;
    }
  }
}

// Alternative flight search using Skyscanner-like APIs
export interface SkyscannerFlightRequest {
  originSkyId: string;
  destinationSkyId: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  currency?: string;
  locale?: string;
  market?: string;
}

class AlternativeFlightService {
  private apiKey: string;
  private baseUrl = 'https://sky-scanner3.p.rapidapi.com/flights';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchFlights(request: SkyscannerFlightRequest): Promise<any> {
    const params = new URLSearchParams({
      originSkyId: request.originSkyId,
      destinationSkyId: request.destinationSkyId,
      departureDate: request.departureDate,
      adults: request.adults.toString(),
      currency: request.currency || 'BRL',
      locale: request.locale || 'pt-BR',
      market: request.market || 'BR',
      ...(request.returnDate && { returnDate: request.returnDate }),
      ...(request.children && { children: request.children.toString() }),
      ...(request.infants && { infants: request.infants.toString() }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/search-roundtrip?${params}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'sky-scanner3.p.rapidapi.com',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching flights with alternative API:', error);
      throw error;
    }
  }

  async getAirports(query: string): Promise<any> {
    const params = new URLSearchParams({
      query,
      locale: 'pt-BR',
    });

    try {
      const response = await fetch(`${this.baseUrl}/search-airport?${params}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'sky-scanner3.p.rapidapi.com',
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching airports:', error);
      throw error;
    }
  }
}

// Export service instances
export const flightSearch = new FlightSearchService(
  import.meta.env.VITE_SERPAPI_KEY || ''
);

export const alternativeFlightSearch = new AlternativeFlightService(
  import.meta.env.VITE_RAPIDAPI_KEY || ''
);

// Helper functions
export const searchOneWayFlights = async (
  departure: string,
  arrival: string,
  departureDate: string,
  adults: number = 1
) => {
  return await flightSearch.searchFlights({
    departure,
    arrival,
    departureDate,
    adults,
  });
};

export const searchRoundTripFlights = async (
  departure: string,
  arrival: string,
  departureDate: string,
  returnDate: string,
  adults: number = 1
) => {
  return await flightSearch.searchFlights({
    departure,
    arrival,
    departureDate,
    returnDate,
    adults,
  });
};

export const getFlightPriceInsights = async (
  departure: string,
  arrival: string,
  departureDate: string
) => {
  return await flightSearch.getFlightInsights(departure, arrival, departureDate);
};