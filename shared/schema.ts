import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(),
  image: text("image").notNull(),
  lat: real("lat"),
  lng: real("lng"),
});

export const insertPlaceSchema = createInsertSchema(places).omit({ id: true });
export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect;

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull(),
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