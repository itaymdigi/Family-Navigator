import { pgTable, text, serial, integer, real, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const tripDays = pgTable("trip_days", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  rating: integer("rating"),
  mapsUrl: text("maps_url"),
  notes: json("notes").$type<string[]>(),
});

export const insertTripDaySchema = createInsertSchema(tripDays).omit({ id: true });
export type InsertTripDay = z.infer<typeof insertTripDaySchema>;
export type TripDay = typeof tripDays.$inferSelect;

export const dayEvents = pgTable("day_events", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull(),
  time: text("time").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
});

export const insertDayEventSchema = createInsertSchema(dayEvents).omit({ id: true });
export type InsertDayEvent = z.infer<typeof insertDayEventSchema>;
export type DayEvent = typeof dayEvents.$inferSelect;

export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: text("duration"),
  price: text("price"),
  lat: real("lat"),
  lng: real("lng"),
  mapsUrl: text("maps_url"),
  wazeUrl: text("waze_url"),
  badges: json("badges").$type<string[]>(),
  image: text("image"),
});

export const insertAttractionSchema = createInsertSchema(attractions).omit({ id: true });
export type InsertAttraction = z.infer<typeof insertAttractionSchema>;
export type Attraction = typeof attractions.$inferSelect;

export const accommodations = pgTable("accommodations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stars: integer("stars").notNull(),
  description: text("description").notNull(),
  priceRange: text("price_range"),
  lat: real("lat"),
  lng: real("lng"),
  mapsUrl: text("maps_url"),
  wazeUrl: text("waze_url"),
  dates: text("dates").notNull(),
  baseName: text("base_name"),
  isSelected: boolean("is_selected").default(false),
});

export const insertAccommodationSchema = createInsertSchema(accommodations).omit({ id: true });
export type InsertAccommodation = z.infer<typeof insertAccommodationSchema>;
export type Accommodation = typeof accommodations.$inferSelect;

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  color: text("color").notNull(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({ id: true });
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull(),
  uploadedBy: integer("uploaded_by"),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

export const currencyRates = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: real("rate").notNull(),
  flag: text("flag").notNull(),
});

export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({ id: true });
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  icon: text("icon").notNull(),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const insertTipSchema = createInsertSchema(tips).omit({ id: true });
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;