import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  budget: text("budget"),
  travelStyle: text("travel_style").array(),
  preferences: text("preferences"),
  status: text("status").default("planning"), // planning, upcoming, in-progress, completed
  itinerary: jsonb("itinerary"),
  packingList: jsonb("packing_list"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  flightNumber: text("flight_number").notNull(),
  airline: text("airline").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  type: text("type").notNull(), // outbound, return
  confirmationCode: text("confirmation_code"),
  gate: text("gate"),
  seat: text("seat"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accommodations = pgTable("accommodations", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  checkInTime: text("check_in_time"), // e.g., "15:00"
  checkOutTime: text("check_out_time"), // e.g., "11:00"
  price: text("price"),
  type: text("type").notNull(), // booked, suggestion
  confirmationCode: text("confirmation_code"),
  contactInfo: text("contact_info"),
  amenities: text("amenities").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  date: timestamp("date").notNull(),
  city: text("city").notNull(),
  time: text("time").notNull(), // e.g., "09:00"
  activity: text("activity").notNull(),
  location: text("location"),
  notes: text("notes"),
  category: text("category"), // food, attraction, transport, etc.
  duration: text("duration"), // e.g., "2 hours"
  estimatedCost: text("estimated_cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // food, shopping, entertainment, transport, accommodation
  city: text("city"),
  date: timestamp("date").notNull(),
  wiseTransactionId: text("wise_transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const travelDocuments = pgTable("travel_documents", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  documentType: text("document_type").notNull(), // passport, visa, insurance, vaccination, etc.
  documentName: text("document_name").notNull(),
  expiryDate: timestamp("expiry_date"),
  required: boolean("required").default(true),
  obtained: boolean("obtained").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // passport, visa, insurance, booking, etc.
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
});

export const insertTripSchema = createInsertSchema(trips).pick({
  name: true,
  destination: true,
  budget: true,
  travelStyle: true,
  preferences: true,
}).extend({
  startDate: z.string(),
  endDate: z.string(),
  cities: z.string().optional(),
  activities: z.string().optional(),
  avoidances: z.string().optional(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  type: true,
  url: true,
  tripId: true,
});

export const insertFlightSchema = createInsertSchema(flights).pick({
  tripId: true,
  flightNumber: true,
  airline: true,
  departureAirport: true,
  arrivalAirport: true,
  departureTime: true,
  arrivalTime: true,
  type: true,
}).extend({
  confirmationCode: z.string().optional(),
  gate: z.string().optional(),
  seat: z.string().optional(),
});

export const insertAccommodationSchema = createInsertSchema(accommodations).pick({
  tripId: true,
  name: true,
  address: true,
  city: true,
  checkIn: true,
  checkOut: true,
  type: true,
}).extend({
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  price: z.string().optional(),
  confirmationCode: z.string().optional(),
  contactInfo: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const insertItineraryItemSchema = createInsertSchema(itineraryItems).pick({
  tripId: true,
  date: true,
  city: true,
  time: true,
  activity: true,
}).extend({
  location: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  estimatedCost: z.string().optional(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  tripId: true,
  amount: true,
  currency: true,
  description: true,
  category: true,
  date: true,
}).extend({
  city: z.string().optional(),
  wiseTransactionId: z.string().optional(),
});

export const insertTravelDocumentSchema = createInsertSchema(travelDocuments).pick({
  tripId: true,
  documentType: true,
  documentName: true,
  expiryDate: true,
  required: true,
  obtained: true,
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;
export type InsertAccommodation = z.infer<typeof insertAccommodationSchema>;
export type Accommodation = typeof accommodations.$inferSelect;
export type InsertItineraryItem = z.infer<typeof insertItineraryItemSchema>;
export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertTravelDocument = z.infer<typeof insertTravelDocumentSchema>;
export type TravelDocument = typeof travelDocuments.$inferSelect;
