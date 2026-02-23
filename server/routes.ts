import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlaceSchema, insertPhotoSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Places
  app.get("/api/places", async (_req, res) => {
    const places = await storage.getPlaces();
    res.json(places);
  });

  app.post("/api/places", async (req, res) => {
    const parsed = insertPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const place = await storage.createPlace(parsed.data);
    res.status(201).json(place);
  });

  app.delete("/api/places/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deletePlace(id);
    res.status(204).send();
  });

  // Photos
  app.get("/api/photos", async (_req, res) => {
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  app.post("/api/photos", async (req, res) => {
    const parsed = insertPhotoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const photo = await storage.createPhoto(parsed.data);
    res.status(201).json(photo);
  });

  app.delete("/api/photos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deletePhoto(id);
    res.status(204).send();
  });

  // Currency Rates
  app.get("/api/currency-rates", async (_req, res) => {
    const rates = await storage.getCurrencyRates();
    res.json(rates);
  });

  return httpServer;
}