import { eq, asc } from "drizzle-orm";
import { db } from "./db";
import {
  tripDays, dayEvents, attractions, accommodations, photos, currencyRates, tips, familyMembers,
  type TripDay, type InsertTripDay,
  type DayEvent, type InsertDayEvent,
  type Attraction, type InsertAttraction,
  type Accommodation, type InsertAccommodation,
  type Photo, type InsertPhoto,
  type CurrencyRate,
  type Tip, type InsertTip,
  type FamilyMember, type InsertFamilyMember,
} from "@shared/schema";

export interface IStorage {
  getTripDays(): Promise<TripDay[]>;
  createTripDay(day: InsertTripDay): Promise<TripDay>;
  updateTripDay(id: number, day: Partial<InsertTripDay>): Promise<TripDay>;
  deleteTripDay(id: number): Promise<void>;

  getDayEvents(dayId: number): Promise<DayEvent[]>;
  createDayEvent(event: InsertDayEvent): Promise<DayEvent>;
  updateDayEvent(id: number, event: Partial<InsertDayEvent>): Promise<DayEvent>;
  deleteDayEvent(id: number): Promise<void>;

  getAttractions(dayId: number): Promise<Attraction[]>;
  createAttraction(attr: InsertAttraction): Promise<Attraction>;
  updateAttraction(id: number, attr: Partial<InsertAttraction>): Promise<Attraction>;
  deleteAttraction(id: number): Promise<void>;

  getAccommodations(): Promise<Accommodation[]>;
  createAccommodation(acc: InsertAccommodation): Promise<Accommodation>;
  updateAccommodation(id: number, acc: Partial<InsertAccommodation>): Promise<Accommodation>;
  deleteAccommodation(id: number): Promise<void>;

  getPhotos(): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;

  getCurrencyRates(): Promise<CurrencyRate[]>;

  getTips(): Promise<Tip[]>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: number, tip: Partial<InsertTip>): Promise<Tip>;
  deleteTip(id: number): Promise<void>;

  getFamilyMembers(): Promise<FamilyMember[]>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<InsertFamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTripDays() { return db.select().from(tripDays).orderBy(asc(tripDays.dayNumber)); }
  async createTripDay(day: InsertTripDay) { const [r] = await db.insert(tripDays).values(day).returning(); return r; }
  async updateTripDay(id: number, day: Partial<InsertTripDay>) { const [r] = await db.update(tripDays).set(day).where(eq(tripDays.id, id)).returning(); return r; }
  async deleteTripDay(id: number) {
    await db.delete(dayEvents).where(eq(dayEvents.dayId, id));
    await db.delete(attractions).where(eq(attractions.dayId, id));
    await db.delete(tripDays).where(eq(tripDays.id, id));
  }

  async getDayEvents(dayId: number) { return db.select().from(dayEvents).where(eq(dayEvents.dayId, dayId)).orderBy(asc(dayEvents.sortOrder)); }
  async createDayEvent(event: InsertDayEvent) { const [r] = await db.insert(dayEvents).values(event).returning(); return r; }
  async updateDayEvent(id: number, event: Partial<InsertDayEvent>) { const [r] = await db.update(dayEvents).set(event).where(eq(dayEvents.id, id)).returning(); return r; }
  async deleteDayEvent(id: number) { await db.delete(dayEvents).where(eq(dayEvents.id, id)); }

  async getAttractions(dayId: number) { return db.select().from(attractions).where(eq(attractions.dayId, dayId)); }
  async createAttraction(attr: InsertAttraction) { const [r] = await db.insert(attractions).values(attr).returning(); return r; }
  async updateAttraction(id: number, attr: Partial<InsertAttraction>) { const [r] = await db.update(attractions).set(attr).where(eq(attractions.id, id)).returning(); return r; }
  async deleteAttraction(id: number) { await db.delete(attractions).where(eq(attractions.id, id)); }

  async getAccommodations() { return db.select().from(accommodations); }
  async createAccommodation(acc: InsertAccommodation) { const [r] = await db.insert(accommodations).values(acc).returning(); return r; }
  async updateAccommodation(id: number, acc: Partial<InsertAccommodation>) { const [r] = await db.update(accommodations).set(acc).where(eq(accommodations.id, id)).returning(); return r; }
  async deleteAccommodation(id: number) { await db.delete(accommodations).where(eq(accommodations.id, id)); }

  async getPhotos() { return db.select().from(photos); }
  async createPhoto(photo: InsertPhoto) { const [r] = await db.insert(photos).values(photo).returning(); return r; }
  async deletePhoto(id: number) { await db.delete(photos).where(eq(photos.id, id)); }

  async getCurrencyRates() { return db.select().from(currencyRates); }

  async getTips() { return db.select().from(tips).orderBy(asc(tips.sortOrder)); }
  async createTip(tip: InsertTip) { const [r] = await db.insert(tips).values(tip).returning(); return r; }
  async updateTip(id: number, tip: Partial<InsertTip>) { const [r] = await db.update(tips).set(tip).where(eq(tips.id, id)).returning(); return r; }
  async deleteTip(id: number) { await db.delete(tips).where(eq(tips.id, id)); }

  async getFamilyMembers() { return db.select().from(familyMembers); }
  async createFamilyMember(member: InsertFamilyMember) { const [r] = await db.insert(familyMembers).values(member).returning(); return r; }
  async updateFamilyMember(id: number, member: Partial<InsertFamilyMember>) { const [r] = await db.update(familyMembers).set(member).where(eq(familyMembers.id, id)).returning(); return r; }
  async deleteFamilyMember(id: number) { await db.delete(familyMembers).where(eq(familyMembers.id, id)); }
}

export const storage = new DatabaseStorage();