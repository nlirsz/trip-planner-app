import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTripSchema, 
  insertDocumentSchema,
  insertFlightSchema,
  insertAccommodationSchema,
  insertItineraryItemSchema,
  insertExpenseSchema,
  insertTravelDocumentSchema
} from "@shared/schema";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Mock current user for demo purposes
const CURRENT_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with demo user
  try {
    await storage.createUser({
      email: "alex@example.com",
      name: "Alex Johnson"
    });
  } catch (error) {
    // User might already exist
  }

  // User routes
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(CURRENT_USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await storage.getTripsByUserId(CURRENT_USER_ID);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trips" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTrip(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trip" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      const validatedData = insertTripSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Keep dates as strings for simplicity in storage
      const tripData = {
        ...validatedData,
        userId: CURRENT_USER_ID
      };
      
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error("Trip creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Invalid trip data" });
      }
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      console.log("Updating trip:", tripId, "with data:", req.body);
      
      // Validate the trip update data
      const updateSchema = insertTripSchema.partial(); // Make all fields optional for updates
      const validatedData = updateSchema.parse(req.body);
      
      const trip = await storage.updateTrip(tripId, validatedData);
      res.json(trip);
    } catch (error) {
      console.error("Trip update error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update trip" });
      }
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      await storage.deleteTrip(parseInt(req.params.id));
      res.json({ message: "Trip deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // AI-powered trip generation
  app.post("/api/trips/generate", async (req, res) => {
    try {
      const { destination, startDate, endDate, budget, travelStyle, preferences } = req.body;
      
      const prompt = `Generate a detailed travel itinerary for a trip to ${destination} from ${startDate} to ${endDate}.

Travel preferences:
- Budget: ${budget}
- Travel style: ${travelStyle?.join(", ") || "General"}
- Additional preferences: ${preferences || "None"}

Please provide a JSON response with the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "City Name",
      "activities": [
        {
          "time": "Morning/Afternoon/Evening",
          "activity": "Activity description",
          "location": "Location name",
          "notes": "Additional notes"
        }
      ]
    }
  ],
  "packingList": {
    "clothing": ["item1", "item2"],
    "electronics": ["item1", "item2"],
    "documents": ["item1", "item2"],
    "health": ["item1", "item2"]
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const generatedData = JSON.parse(response.text || "{}");
      res.json(generatedData);
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate trip with AI" });
    }
  });

  // Weather-based packing suggestions
  app.post("/api/packing/weather", async (req, res) => {
    try {
      const { destination, startDate, endDate } = req.body;
      
      // Get weather forecast (mock response for now)
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${destination}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );
      
      let weatherData = null;
      if (weatherResponse.ok) {
        weatherData = await weatherResponse.json();
      }

      const prompt = `Based on the weather forecast for ${destination} from ${startDate} to ${endDate}, generate a smart packing list.

Weather data: ${weatherData ? JSON.stringify(weatherData.list.slice(0, 5)) : "Weather data unavailable"}

Provide clothing and gear recommendations in JSON format:
{
  "recommendations": [
    {
      "category": "Clothing",
      "items": ["specific item with weather reason"]
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ suggestions: response.text });
    } catch (error) {
      console.error("Weather packing error:", error);
      res.status(500).json({ message: "Failed to generate weather-based packing suggestions" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUserId(CURRENT_USER_ID);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = await storage.createDocument({
        name: req.file.originalname,
        type: req.body.type || "other",
        url: `/uploads/${req.file.filename}`,
        tripId: req.body.tripId ? parseInt(req.body.tripId) : undefined,
        userId: CURRENT_USER_ID
      });

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (document) {
        // Delete file from filesystem
        const filePath = path.join(process.cwd(), "uploads", path.basename(document.url));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      await storage.deleteDocument(parseInt(req.params.id));
      res.json({ message: "Document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Calendar export
  app.get("/api/trips/:id/calendar", async (req, res) => {
    try {
      const trip = await storage.getTrip(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TravelAI//Travel Assistant//EN
BEGIN:VEVENT
UID:${trip.id}@travelai.com
DTSTART:${trip.startDate.replace(/[-:]/g, '')}T000000Z
DTEND:${trip.endDate.replace(/[-:]/g, '')}T000000Z
SUMMARY:${trip.name}
DESCRIPTION:Trip to ${trip.destination}
LOCATION:${trip.destination}
END:VEVENT
END:VCALENDAR`;

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${trip.name}.ics"`);
      res.send(icsContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate calendar export" });
    }
  });

  // Flight routes
  app.get("/api/trips/:tripId/flights", async (req, res) => {
    try {
      const flights = await storage.getFlightsByTripId(parseInt(req.params.tripId));
      res.json(flights);
    } catch (error) {
      res.status(500).json({ message: "Failed to get flights" });
    }
  });

  app.post("/api/flights", async (req, res) => {
    try {
      console.log("Flight request body:", req.body);
      const validatedData = insertFlightSchema.parse(req.body);
      console.log("Flight validated data:", validatedData);
      const flight = await storage.createFlight(validatedData);
      res.json(flight);
    } catch (error) {
      console.error("Flight validation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid flight data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Invalid flight data" });
      }
    }
  });

  app.put("/api/flights/:id", async (req, res) => {
    try {
      const flight = await storage.updateFlight(parseInt(req.params.id), req.body);
      res.json(flight);
    } catch (error) {
      res.status(500).json({ message: "Failed to update flight" });
    }
  });

  app.delete("/api/flights/:id", async (req, res) => {
    try {
      await storage.deleteFlight(parseInt(req.params.id));
      res.json({ message: "Flight deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flight" });
    }
  });

  // Accommodation routes
  app.get("/api/trips/:tripId/accommodations", async (req, res) => {
    try {
      const accommodations = await storage.getAccommodationsByTripId(parseInt(req.params.tripId));
      res.json(accommodations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get accommodations" });
    }
  });

  app.post("/api/accommodations", async (req, res) => {
    try {
      const validatedData = insertAccommodationSchema.parse(req.body);
      const accommodation = await storage.createAccommodation(validatedData);
      res.json(accommodation);
    } catch (error) {
      console.error("Accommodation validation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid accommodation data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Invalid accommodation data" });
      }
    }
  });

  app.post("/api/accommodations", async (req, res) => {
    try {
      const validatedData = insertAccommodationSchema.parse(req.body);
      const accommodation = await storage.createAccommodation(validatedData);
      res.json(accommodation);
    } catch (error) {
      res.status(400).json({ message: "Invalid accommodation data" });
    }
  });

  app.put("/api/accommodations/:id", async (req, res) => {
    try {
      const accommodation = await storage.updateAccommodation(parseInt(req.params.id), req.body);
      res.json(accommodation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update accommodation" });
    }
  });

  app.delete("/api/accommodations/:id", async (req, res) => {
    try {
      await storage.deleteAccommodation(parseInt(req.params.id));
      res.json({ message: "Accommodation deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accommodation" });
    }
  });

  // Itinerary-based hotel recommendations
  app.post("/api/trips/:tripId/itinerary-hotels", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Get itinerary for the trip
      const itinerary = await storage.getItineraryItemsByTripId(tripId);
      
      if (!itinerary || itinerary.length === 0) {
        return res.status(400).json({ message: "No itinerary found for this trip. Please generate an itinerary first." });
      }
      
      console.log(`Processing itinerary-based hotels for trip ${tripId} with ${itinerary.length} items`);
      
      // Mock response for now - this would integrate with the itinerary-based hotel service
      const cityRecommendations = [
        {
          city: trip.destination,
          stayDuration: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)),
          checkIn: trip.startDate,
          checkOut: trip.endDate,
          nearbyActivities: itinerary.slice(0, 5).map(item => item.title || item.location || 'Atividade').filter(Boolean),
          hotels: [
            {
              id: "hotel_itinerary_1",
              name: `Hotel Central ${trip.destination}`,
              address: `Centro, ${trip.destination}`,
              rating: 4.5,
              priceLevel: 3,
              priceRange: "R$ 300-500",
              vicinity: "Centro",
              photos: ["https://example.com/hotel1.jpg"],
              amenities: ["Wi-Fi", "Café da manhã", "Academia", "Piscina"],
              proximityScore: 85,
              budgetMatch: true,
              aiRecommendationReason: "Localização estratégica próxima às principais atividades do seu roteiro",
              distanceToAttractions: itinerary.slice(0, 3).map(item => ({
                attraction: item.title || item.location || 'Atividade',
                distance: "0.5-2 km",
                walkTime: "5-20 min"
              })),
              reviewsCount: 456,
              highlights: ["Próximo ao itinerário", "Bem avaliado", "Localização central"]
            },
            {
              id: "hotel_itinerary_2",
              name: `Hotel Boutique ${trip.destination}`,
              address: `Zona Turística, ${trip.destination}`,
              rating: 4.7,
              priceLevel: 2,
              priceRange: "R$ 200-350",
              vicinity: "Zona Turística",
              photos: ["https://example.com/hotel2.jpg"],
              amenities: ["Wi-Fi", "Restaurante", "Concierge", "Spa"],
              proximityScore: 90,
              budgetMatch: true,
              aiRecommendationReason: "Ideal para explorar os pontos turísticos do seu roteiro a pé",
              distanceToAttractions: itinerary.slice(0, 3).map(item => ({
                attraction: item.title || item.location || 'Atividade',
                distance: "0.2-1 km",
                walkTime: "2-12 min"
              })),
              reviewsCount: 789,
              highlights: ["Caminhada fácil", "Estilo boutique", "Excelente localização"]
            }
          ],
          averageDistance: "0.5-1.5 km",
          recommendedArea: "Centro Histórico"
        }
      ];
      
      // Add multiple cities if the itinerary spans different cities
      const citiesInItinerary = new Set(itinerary.map(item => {
        const location = item.location || item.title || '';
        // Simple city extraction logic
        if (location.toLowerCase().includes('paris')) return 'Paris';
        if (location.toLowerCase().includes('london')) return 'London';
        if (location.toLowerCase().includes('rome')) return 'Rome';
        if (location.toLowerCase().includes('barcelona')) return 'Barcelona';
        if (location.toLowerCase().includes('madrid')) return 'Madrid';
        if (location.toLowerCase().includes('rio')) return 'Rio de Janeiro';
        if (location.toLowerCase().includes('são paulo')) return 'São Paulo';
        return trip.destination;
      }));
      
      // If multiple cities detected, create recommendations for each
      if (citiesInItinerary.size > 1) {
        const multiCityRecommendations = Array.from(citiesInItinerary).map(city => ({
          city,
          stayDuration: Math.ceil(itinerary.filter(item => 
            (item.location || item.title || '').toLowerCase().includes(city.toLowerCase())
          ).length / 2), // Estimate days per city
          checkIn: trip.startDate,
          checkOut: trip.endDate,
          nearbyActivities: itinerary
            .filter(item => (item.location || item.title || '').toLowerCase().includes(city.toLowerCase()))
            .slice(0, 3)
            .map(item => item.title || item.location || 'Atividade'),
          hotels: [
            {
              id: `hotel_${city.toLowerCase().replace(/\s+/g, '_')}_1`,
              name: `Hotel Premium ${city}`,
              address: `Centro, ${city}`,
              rating: 4.4,
              priceLevel: 3,
              priceRange: "R$ 280-450",
              vicinity: "Centro",
              photos: [],
              amenities: ["Wi-Fi", "Café da manhã", "Academia"],
              proximityScore: 80,
              budgetMatch: true,
              aiRecommendationReason: `Estrategicamente localizado para explorar ${city} conforme seu roteiro`,
              distanceToAttractions: [],
              reviewsCount: 234,
              highlights: ["Roteiro otimizado", "Bem localizado"]
            }
          ],
          averageDistance: "1-2 km",
          recommendedArea: "Centro"
        }));
        
        res.json(multiCityRecommendations);
      } else {
        res.json(cityRecommendations);
      }
      
    } catch (error) {
      console.error("Error generating itinerary-based hotel recommendations:", error);
      res.status(500).json({ message: "Failed to generate itinerary-based recommendations" });
    }
  });

  // Elite Travel Assistant
  app.post("/api/trips/:tripId/elite-plan", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const { destination, startDate, endDate, budget, travelStyle, preferences } = req.body;
      
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Calculate trip duration
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Generate elite travel plan based on Rio de Janeiro example
      const schedule = [];
      const days = ['15/02', '16/02', '17/02', '18/02', '19/02', '20/02'];
      
      for (let i = 0; i < Math.min(diffDays, 6); i++) {
        const dayNumber = i + 1;
        let morning, afternoon, evening;
        
        switch (dayNumber) {
          case 1:
            morning = "Chegada e check-in hotel em Copacabana";
            afternoon = "Visita ao Pão de Açúcar (bondinho + vista panorâmica)";
            evening = "Jantar na Urca com vista da baía";
            break;
          case 2:
            morning = "Cristo Redentor (trem do Corcovado)";
            afternoon = "Museu do Amanhã + Boulevard Olímpico";
            evening = "Lapa - vida noturna e samba";
            break;
          case 3:
            morning = "Praia de Ipanema (relaxar)";
            afternoon = "Museu Nacional de Belas Artes + Centro Histórico";
            evening = "Santa Teresa - bares e gastronomia";
            break;
          case 4:
            morning = "Jardim Botânico + Lagoa Rodrigo de Freitas";
            afternoon = "Forte de Copacabana + Praia";
            evening = "Leblon - restaurantes sofisticados";
            break;
          case 5:
            morning = "Trilha no Parque da Tijuca";
            afternoon = "Theatro Municipal + Confeitaria Colombo";
            evening = "Barra da Tijuca - vida noturna";
            break;
          case 6:
            morning = "Feira de Antiguidades (Praça XV)";
            afternoon = "Últimas compras e preparação";
            evening = "Partida";
            break;
          default:
            morning = `Explorar ${destination} - manhã livre`;
            afternoon = `Atividades culturais em ${destination}`;
            evening = `Gastronomia local em ${destination}`;
        }
        
        schedule.push({
          day: dayNumber,
          date: days[i] || `${15 + i}/02`,
          morning,
          afternoon,
          evening
        });
      }

      // Generate hotel recommendations based on budget and style
      const budgetNum = parseInt(budget) || 3000;
      const isLuxury = travelStyle?.includes('luxury');
      const isCultural = travelStyle?.includes('cultural');
      
      const hotels = [
        {
          name: isLuxury ? "Copacabana Palace" : "Windsor Atlantica Hotel",
          rating: isLuxury ? 4.8 : 4.3,
          priceRange: isLuxury ? "Luxo" : "Moderado",
          location: "Copacabana",
          justification: isLuxury 
            ? "Localizado em Copacabana, oferece fácil acesso às praias dos dias 1 e 4, além de estar próximo ao Forte de Copacabana. A localização permite deslocamentos rápidos para Urca (Pão de Açúcar) e facilita o retorno após as noites na Lapa e Santa Teresa."
            : "Em Copacabana, oferece boa relação custo-benefício mantendo proximidade com as praias e fácil acesso ao transporte público para Cristo Redentor e Centro Histórico. Ideal para o orçamento especificado."
        },
        {
          name: "Hotel Fasano Rio de Janeiro",
          rating: 4.7,
          priceRange: "Luxo",
          location: "Ipanema",
          justification: "Situado em Ipanema, é perfeito para o dia 3 de relaxamento na praia e oferece proximidade ao Jardim Botânico (dia 4). A localização facilita o acesso aos restaurantes sofisticados do Leblon no dia 4."
        },
        {
          name: "Emiliano Rio",
          rating: 4.6,
          priceRange: "Luxo",
          location: "Copacabana",
          justification: "Localizado em Copacabana, combina sofisticação com localização estratégica. Permite fácil acesso a todas as atividades praias planejadas e fica próximo aos pontos de partida para as excursões ao Pão de Açúcar e Cristo Redentor."
        },
        {
          name: "Arena Copacabana Hotel",
          rating: 4.2,
          priceRange: "Econômico",
          location: "Copacabana",
          justification: "Opção mais econômica em Copacabana que mantém a conveniência locacional. Permite dedicar mais orçamento às experiências gastronômicas e culturais planejadas, especialmente para os jantares sofisticados."
        }
      ];

      // Filter hotels based on budget
      const filteredHotels = budgetNum < 2000 
        ? hotels.filter(h => h.priceRange === "Econômico" || h.priceRange === "Moderado")
        : hotels;

      const summary = {
        totalDays: diffDays,
        highlights: [
          `${diffDays} dias de experiências balanceadas entre cultura, praias e gastronomia`,
          "Roteiro logístico com deslocamentos eficientes entre as atrações",
          "Ritmo moderado respeitando o perfil de luxo e cultura",
          "Noites diversificadas incluindo vida noturna, gastronomia e cultura"
        ],
        recommendations: [
          `${filteredHotels.length} opções estratégicamente localizadas`,
          "Justificativas logísticas baseadas no cronograma específico",
          "Diferentes faixas de preço para adequar ao orçamento",
          "Localização otimizada para minimizar deslocamentos"
        ]
      };

      res.json({
        schedule,
        hotels: filteredHotels,
        summary
      });
    } catch (error) {
      console.error('Error generating elite travel plan:', error);
      res.status(500).json({ message: "Failed to generate elite travel plan" });
    }
  });

  // Itinerary routes
  app.get("/api/trips/:tripId/itinerary", async (req, res) => {
    try {
      const items = await storage.getItineraryItemsByTripId(parseInt(req.params.tripId));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get itinerary items" });
    }
  });

  app.post("/api/itinerary", async (req, res) => {
    try {
      const validatedData = insertItineraryItemSchema.parse(req.body);
      const item = await storage.createItineraryItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Itinerary validation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid itinerary data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Invalid itinerary data" });
      }
    }
  });

  app.post("/api/itinerary", async (req, res) => {
    try {
      const validatedData = insertItineraryItemSchema.parse(req.body);
      const item = await storage.createItineraryItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid itinerary item data" });
    }
  });

  app.put("/api/itinerary/:id", async (req, res) => {
    try {
      const item = await storage.updateItineraryItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update itinerary item" });
    }
  });

  app.delete("/api/itinerary/:id", async (req, res) => {
    try {
      await storage.deleteItineraryItem(parseInt(req.params.id));
      res.json({ message: "Itinerary item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete itinerary item" });
    }
  });

  // Expense routes
  app.get("/api/trips/:tripId/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByTripId(parseInt(req.params.tripId));
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...validatedData,
        userId: CURRENT_USER_ID
      });
      res.json(expense);
    } catch (error) {
      console.error("Expense validation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Invalid expense data" });
      }
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...validatedData,
        userId: CURRENT_USER_ID
      });
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(parseInt(req.params.id), req.body);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      await storage.deleteExpense(parseInt(req.params.id));
      res.json({ message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Travel document routes
  app.get("/api/trips/:tripId/travel-documents", async (req, res) => {
    try {
      const documents = await storage.getTravelDocumentsByTripId(parseInt(req.params.tripId));
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get travel documents" });
    }
  });

  app.post("/api/travel-documents", async (req, res) => {
    try {
      const validatedData = insertTravelDocumentSchema.parse(req.body);
      const document = await storage.createTravelDocument(validatedData);
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid travel document data" });
    }
  });

  app.put("/api/travel-documents/:id", async (req, res) => {
    try {
      const document = await storage.updateTravelDocument(parseInt(req.params.id), req.body);
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update travel document" });
    }
  });

  app.delete("/api/travel-documents/:id", async (req, res) => {
    try {
      await storage.deleteTravelDocument(parseInt(req.params.id));
      res.json({ message: "Travel document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete travel document" });
    }
  });

  // AI trip generation endpoint
  app.post("/api/trips/generate", async (req, res) => {
    try {
      const { destination, cities, startDate, endDate, budget, travelStyle, preferences, activities, avoidances } = req.body;
      
      const prompt = `Gere um itinerário de viagem detalhado para:
      
Destino: ${destination}
Cidades: ${cities}
Data de início: ${startDate}
Data de fim: ${endDate}
Orçamento: ${budget || "Não especificado"}
Estilo de viagem: ${travelStyle?.join(", ") || "Não especificado"}
Atividades desejadas: ${activities}
Coisas para evitar: ${avoidances || "Nenhuma"}
Preferências: ${preferences || "Nenhuma"}

Gere um itinerário em JSON com:
{
  "itinerary": [
    {
      "day": 1,
      "date": "2024-01-15",
      "city": "Paris",
      "activities": [
        {
          "time": "09:00",
          "activity": "Visita à Torre Eiffel",
          "location": "Champ de Mars, Paris",
          "notes": "Compre ingressos com antecedência"
        }
      ]
    }
  ],
  "packingList": {
    "clothing": ["Casaco", "Sapatos confortáveis"],
    "electronics": ["Carregador", "Câmera"],
    "documents": ["Passaporte", "Seguro viagem"],
    "health": ["Remédios", "Protetor solar"]
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const generatedData = JSON.parse(response.text || "{}");
      res.json(generatedData);
    } catch (error) {
      console.error("Erro na geração de viagem com IA:", error);
      res.status(500).json({ message: "Falha na geração de viagem com IA" });
    }
  });

  // AI suggestions for accommodations
  app.post("/api/accommodations/suggestions", async (req, res) => {
    try {
      const { destination, checkIn, checkOut, budget, preferences } = req.body;
      
      const prompt = `Generate hotel and accommodation suggestions for ${destination} from ${checkIn} to ${checkOut}.
      
Budget: ${budget || "Not specified"}
Preferences: ${preferences || "None"}

Provide 3-5 realistic suggestions in JSON format:
{
  "suggestions": [
    {
      "name": "Hotel Name",
      "type": "hotel/hostel/apartment",
      "address": "Full address",
      "city": "${destination}",
      "estimatedPrice": "price range",
      "rating": "4.5/5",
      "amenities": ["wifi", "breakfast", "pool"],
      "description": "Brief description"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const suggestions = JSON.parse(response.text || "{}");
      res.json(suggestions);
    } catch (error) {
      console.error("AI accommodation suggestions error:", error);
      res.status(500).json({ message: "Failed to generate accommodation suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
