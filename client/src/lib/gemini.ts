export interface TripGenerationRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget?: string;
  travelStyle?: string[];
  preferences?: string;
}

export interface Activity {
  time: string;
  activity: string;
  location: string;
  notes?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
}

export interface PackingList {
  clothing: string[];
  electronics: string[];
  documents: string[];
  health: string[];
}

export interface GeneratedTrip {
  itinerary: ItineraryDay[];
  packingList: PackingList;
}

export async function generateTripWithAI(request: TripGenerationRequest): Promise<GeneratedTrip> {
  const response = await fetch('/api/trips/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate trip with AI');
  }

  return response.json();
}

export async function generateWeatherBasedPacking(destination: string, startDate: string, endDate: string): Promise<{ suggestions: string }> {
  const response = await fetch('/api/packing/weather', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destination, startDate, endDate }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate weather-based packing suggestions');
  }

  return response.json();
}
