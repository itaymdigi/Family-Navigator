import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  places, photos, currencyRates,
  type Place, type InsertPlace,
  type Photo, type InsertPhoto,
  type CurrencyRate, type InsertCurrencyRate,
} from "@shared/schema";

export interface IStorage {
  getPlaces(): Promise<Place[]>;
  getPlace(id: number): Promise<Place | undefined>;
  createPlace(place: InsertPlace): Promise<Place>;
  deletePlace(id: number): Promise<void>;

  getPhotos(): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;

  getCurrencyRates(): Promise<CurrencyRate[]>;
  getCurrencyRate(id: number): Promise<CurrencyRate | undefined>;
  createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate>;
}

export class DatabaseStorage implements IStorage {
  async getPlaces(): Promise<Place[]> {
    return db.select().from(places);
  }

  async getPlace(id: number): Promise<Place | undefined> {
    const [place] = await db.select().from(places).where(eq(places.id, id));
    return place;
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [created] = await db.insert(places).values(place).returning();
    return created;
  }

  async deletePlace(id: number): Promise<void> {
    await db.delete(places).where(eq(places.id, id));
  }

  async getPhotos(): Promise<Photo[]> {
    return db.select().from(photos);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [created] = await db.insert(photos).values(photo).returning();
    return created;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async getCurrencyRates(): Promise<CurrencyRate[]> {
    return db.select().from(currencyRates);
  }

  async getCurrencyRate(id: number): Promise<CurrencyRate | undefined> {
    const [rate] = await db.select().from(currencyRates).where(eq(currencyRates.id, id));
    return rate;
  }

  async createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const [created] = await db.insert(currencyRates).values(rate).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();