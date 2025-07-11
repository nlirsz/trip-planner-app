import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTripSchema, insertDocumentSchema } from "@shared/schema";
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
      const validatedData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip({
        ...validatedData,
        userId: CURRENT_USER_ID
      });
      res.json(trip);
    } catch (error) {
      res.status(400).json({ message: "Invalid trip data" });
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
DTSTART:${trip.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${trip.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
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

  const httpServer = createServer(app);
  return httpServer;
}
