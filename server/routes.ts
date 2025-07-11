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
      const trip = await storage.updateTrip(parseInt(req.params.id), req.body);
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: "Failed to update trip" });
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
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              itinerary: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "number" },
                    date: { type: "string" },
                    city: { type: "string" },
                    activities: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          time: { type: "string" },
                          activity: { type: "string" },
                          location: { type: "string" },
                          notes: { type: "string" }
                        },
                        required: ["time", "activity", "location"]
                      }
                    }
                  },
                  required: ["day", "date", "city", "activities"]
                }
              },
              packingList: {
                type: "object",
                properties: {
                  clothing: { type: "array", items: { type: "string" } },
                  electronics: { type: "array", items: { type: "string" } },
                  documents: { type: "array", items: { type: "string" } },
                  health: { type: "array", items: { type: "string" } }
                }
              }
            },
            required: ["itinerary", "packingList"]
          }
        },
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
