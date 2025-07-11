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
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  budget: text("budget"),
  travelStyle: text("travel_style").array(),
  preferences: text("preferences"),
  status: text("status").default("planning"), // planning, upcoming, in-progress, completed
  itinerary: jsonb("itinerary"),
  packingList: jsonb("packing_list"),
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
  startDate: true,
  endDate: true,
  budget: true,
  travelStyle: true,
  preferences: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  type: true,
  url: true,
  tripId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
