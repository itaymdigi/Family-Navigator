import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPhotoSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/trip-days", async (_req, res) => {
    const days = await storage.getTripDays();
    res.json(days);
  });

  app.get("/api/trip-days/:id/events", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const events = await storage.getDayEvents(id);
    res.json(events);
  });

  app.get("/api/trip-days/:id/attractions", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const attrs = await storage.getAttractions(id);
    res.json(attrs);
  });

  app.get("/api/accommodations", async (_req, res) => {
    const accs = await storage.getAccommodations();
    res.json(accs);
  });

  app.get("/api/photos", async (_req, res) => {
    const p = await storage.getPhotos();
    res.json(p);
  });

  app.post("/api/photos", async (req, res) => {
    const parsed = insertPhotoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const photo = await storage.createPhoto(parsed.data);
    res.status(201).json(photo);
  });

  app.delete("/api/photos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deletePhoto(id);
    res.status(204).send();
  });

  app.get("/api/currency-rates", async (_req, res) => {
    const rates = await storage.getCurrencyRates();
    res.json(rates);
  });

  app.get("/api/tips", async (_req, res) => {
    const t = await storage.getTips();
    res.json(t);
  });

  return httpServer;
}