import { users, trips, documents, type User, type Trip, type Document, type InsertUser, type InsertTrip, type InsertDocument } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trips
  getTrip(id: number): Promise<Trip | undefined>;
  getTripsByUserId(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip & { userId: number }): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getDocumentsByTripId(tripId: number): Promise<Document[]>;
  createDocument(document: InsertDocument & { userId: number }): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private trips: Map<number, Trip> = new Map();
  private documents: Map<number, Document> = new Map();
  private currentUserId = 1;
  private currentTripId = 1;
  private currentDocumentId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.userId === userId);
  }

  async createTrip(trip: InsertTrip & { userId: number }): Promise<Trip> {
    const newTrip: Trip = {
      ...trip,
      id: this.currentTripId++,
      status: "planning",
      itinerary: null,
      packingList: null,
      createdAt: new Date(),
      budget: trip.budget || null,
      travelStyle: trip.travelStyle || null,
      preferences: trip.preferences || null,
    };
    this.trips.set(newTrip.id, newTrip);
    return newTrip;
  }

  async updateTrip(id: number, tripUpdate: Partial<Trip>): Promise<Trip> {
    const existingTrip = this.trips.get(id);
    if (!existingTrip) {
      throw new Error("Trip not found");
    }
    const updatedTrip = { ...existingTrip, ...tripUpdate };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<void> {
    this.trips.delete(id);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async getDocumentsByTripId(tripId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.tripId === tripId);
  }

  async createDocument(document: InsertDocument & { userId: number }): Promise<Document> {
    const newDocument: Document = {
      ...document,
      id: this.currentDocumentId++,
      uploadedAt: new Date(),
      tripId: document.tripId || null,
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }
}

export const storage = new MemStorage();
