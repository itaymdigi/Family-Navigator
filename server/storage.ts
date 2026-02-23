import { eq, asc } from "drizzle-orm";
import { db } from "./db";
import {
  tripDays, dayEvents, attractions, accommodations, photos, currencyRates, tips,
  type TripDay, type DayEvent, type Attraction, type Accommodation,
  type Photo, type InsertPhoto, type CurrencyRate, type Tip,
} from "@shared/schema";

export interface IStorage {
  getTripDays(): Promise<TripDay[]>;
  getDayEvents(dayId: number): Promise<DayEvent[]>;
  getAttractions(dayId: number): Promise<Attraction[]>;
  getAccommodations(): Promise<Accommodation[]>;
  getPhotos(): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  getCurrencyRates(): Promise<CurrencyRate[]>;
  getTips(): Promise<Tip[]>;
}

export class DatabaseStorage implements IStorage {
  async getTripDays(): Promise<TripDay[]> {
    return db.select().from(tripDays).orderBy(asc(tripDays.dayNumber));
  }

  async getDayEvents(dayId: number): Promise<DayEvent[]> {
    return db.select().from(dayEvents).where(eq(dayEvents.dayId, dayId)).orderBy(asc(dayEvents.sortOrder));
  }

  async getAttractions(dayId: number): Promise<Attraction[]> {
    return db.select().from(attractions).where(eq(attractions.dayId, dayId));
  }

  async getAccommodations(): Promise<Accommodation[]> {
    return db.select().from(accommodations);
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

  async getTips(): Promise<Tip[]> {
    return db.select().from(tips).orderBy(asc(tips.sortOrder));
  }
}

export const storage = new DatabaseStorage();