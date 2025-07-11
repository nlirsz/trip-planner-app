import { 
  users, trips, documents, flights, accommodations, itineraryItems, expenses, travelDocuments,
  type User, type Trip, type Document, type Flight, type Accommodation, type ItineraryItem, type Expense, type TravelDocument,
  type InsertUser, type InsertTrip, type InsertDocument, type InsertFlight, type InsertAccommodation, type InsertItineraryItem, type InsertExpense, type InsertTravelDocument
} from "@shared/schema";

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
  
  // Flights
  getFlightsByTripId(tripId: number): Promise<Flight[]>;
  createFlight(flight: InsertFlight): Promise<Flight>;
  updateFlight(id: number, flight: Partial<Flight>): Promise<Flight>;
  deleteFlight(id: number): Promise<void>;
  
  // Accommodations
  getAccommodationsByTripId(tripId: number): Promise<Accommodation[]>;
  createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation>;
  updateAccommodation(id: number, accommodation: Partial<Accommodation>): Promise<Accommodation>;
  deleteAccommodation(id: number): Promise<void>;
  
  // Itinerary Items
  getItineraryItemsByTripId(tripId: number): Promise<ItineraryItem[]>;
  createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem>;
  updateItineraryItem(id: number, item: Partial<ItineraryItem>): Promise<ItineraryItem>;
  deleteItineraryItem(id: number): Promise<void>;
  
  // Expenses
  getExpensesByTripId(tripId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense & { userId: number }): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  
  // Travel Documents
  getTravelDocumentsByTripId(tripId: number): Promise<TravelDocument[]>;
  createTravelDocument(document: InsertTravelDocument): Promise<TravelDocument>;
  updateTravelDocument(id: number, document: Partial<TravelDocument>): Promise<TravelDocument>;
  deleteTravelDocument(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private trips: Map<number, Trip> = new Map();
  private documents: Map<number, Document> = new Map();
  private flights: Map<number, Flight> = new Map();
  private accommodations: Map<number, Accommodation> = new Map();
  private itineraryItems: Map<number, ItineraryItem> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private travelDocuments: Map<number, TravelDocument> = new Map();
  private currentUserId = 1;
  private currentTripId = 1;
  private currentDocumentId = 1;
  private currentFlightId = 1;
  private currentAccommodationId = 1;
  private currentItineraryItemId = 1;
  private currentExpenseId = 1;
  private currentTravelDocumentId = 1;

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

  // Flights
  async getFlightsByTripId(tripId: number): Promise<Flight[]> {
    return Array.from(this.flights.values()).filter(flight => flight.tripId === tripId);
  }

  async createFlight(flight: InsertFlight): Promise<Flight> {
    const newFlight: Flight = {
      ...flight,
      id: this.currentFlightId++,
      createdAt: new Date(),
      confirmationCode: flight.confirmationCode || null,
      gate: flight.gate || null,
      seat: flight.seat || null,
    };
    this.flights.set(newFlight.id, newFlight);
    return newFlight;
  }

  async updateFlight(id: number, flightUpdate: Partial<Flight>): Promise<Flight> {
    const existingFlight = this.flights.get(id);
    if (!existingFlight) {
      throw new Error(`Flight with id ${id} not found`);
    }
    const updatedFlight = { ...existingFlight, ...flightUpdate };
    this.flights.set(id, updatedFlight);
    return updatedFlight;
  }

  async deleteFlight(id: number): Promise<void> {
    this.flights.delete(id);
  }

  // Accommodations
  async getAccommodationsByTripId(tripId: number): Promise<Accommodation[]> {
    return Array.from(this.accommodations.values()).filter(accommodation => accommodation.tripId === tripId);
  }

  async createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation> {
    const newAccommodation: Accommodation = {
      ...accommodation,
      id: this.currentAccommodationId++,
      createdAt: new Date(),
      confirmationCode: accommodation.confirmationCode || null,
      checkInTime: accommodation.checkInTime || null,
      checkOutTime: accommodation.checkOutTime || null,
      price: accommodation.price || null,
      contactInfo: accommodation.contactInfo || null,
      amenities: accommodation.amenities || null,
    };
    this.accommodations.set(newAccommodation.id, newAccommodation);
    return newAccommodation;
  }

  async updateAccommodation(id: number, accommodationUpdate: Partial<Accommodation>): Promise<Accommodation> {
    const existingAccommodation = this.accommodations.get(id);
    if (!existingAccommodation) {
      throw new Error(`Accommodation with id ${id} not found`);
    }
    const updatedAccommodation = { ...existingAccommodation, ...accommodationUpdate };
    this.accommodations.set(id, updatedAccommodation);
    return updatedAccommodation;
  }

  async deleteAccommodation(id: number): Promise<void> {
    this.accommodations.delete(id);
  }

  // Itinerary Items
  async getItineraryItemsByTripId(tripId: number): Promise<ItineraryItem[]> {
    return Array.from(this.itineraryItems.values()).filter(item => item.tripId === tripId);
  }

  async createItineraryItem(item: InsertItineraryItem): Promise<ItineraryItem> {
    const newItem: ItineraryItem = {
      ...item,
      id: this.currentItineraryItemId++,
      createdAt: new Date(),
      location: item.location || null,
      notes: item.notes || null,
      category: item.category || null,
      duration: item.duration || null,
      estimatedCost: item.estimatedCost || null,
    };
    this.itineraryItems.set(newItem.id, newItem);
    return newItem;
  }

  async updateItineraryItem(id: number, itemUpdate: Partial<ItineraryItem>): Promise<ItineraryItem> {
    const existingItem = this.itineraryItems.get(id);
    if (!existingItem) {
      throw new Error(`Itinerary item with id ${id} not found`);
    }
    const updatedItem = { ...existingItem, ...itemUpdate };
    this.itineraryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItineraryItem(id: number): Promise<void> {
    this.itineraryItems.delete(id);
  }

  // Expenses
  async getExpensesByTripId(tripId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.tripId === tripId);
  }

  async createExpense(expense: InsertExpense & { userId: number }): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: this.currentExpenseId++,
      createdAt: new Date(),
      city: expense.city || null,
      wiseTransactionId: expense.wiseTransactionId || null,
    };
    this.expenses.set(newExpense.id, newExpense);
    return newExpense;
  }

  async updateExpense(id: number, expenseUpdate: Partial<Expense>): Promise<Expense> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    const updatedExpense = { ...existingExpense, ...expenseUpdate };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }

  // Travel Documents
  async getTravelDocumentsByTripId(tripId: number): Promise<TravelDocument[]> {
    return Array.from(this.travelDocuments.values()).filter(doc => doc.tripId === tripId);
  }

  async createTravelDocument(document: InsertTravelDocument): Promise<TravelDocument> {
    const newDocument: TravelDocument = {
      ...document,
      id: this.currentTravelDocumentId++,
      createdAt: new Date(),
      notes: document.notes || null,
      expiryDate: document.expiryDate || null,
      required: document.required || null,
      obtained: document.obtained || null,
    };
    this.travelDocuments.set(newDocument.id, newDocument);
    return newDocument;
  }

  async updateTravelDocument(id: number, documentUpdate: Partial<TravelDocument>): Promise<TravelDocument> {
    const existingDocument = this.travelDocuments.get(id);
    if (!existingDocument) {
      throw new Error(`Travel document with id ${id} not found`);
    }
    const updatedDocument = { ...existingDocument, ...documentUpdate };
    this.travelDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteTravelDocument(id: number): Promise<void> {
    this.travelDocuments.delete(id);
  }
}

export const storage = new MemStorage();
