import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertTripDaySchema, insertDayEventSchema, insertAttractionSchema,
  insertAccommodationSchema, insertPhotoSchema, insertTipSchema,
  insertFamilyMemberSchema,
  tripDays, dayEvents, attractions, accommodations, tips,
} from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

const openrouter = new OpenAI({
  baseURL: process.env.OPENROUTER_API_KEY
    ? "https://openrouter.ai/api/v1"
    : process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY || process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});

const TRIP_SYSTEM_PROMPT = `אתה מדריך טיולים וירטואלי מומחה לצפון צ'כיה. אתה עוזר למשפחה ישראלית (2 מבוגרים + 2 ילדים גילאי 11-14) שנוסעת לטיול בצפון צ'כיה בין 25.3 ל-4.4.2026.

פרטי הטיול:
- בסיס 1: ליברץ (3 לילות) - iQLANDIA, קניון אדמונד, טירות גן עדן בוהמי
- בסיס 2: שפינדלרוב מלין, OREA Resort (2 לילות) - מפלים, שביל צמרות העצים
- בסיס 3: Apartmán v tichu, טפליצה (3 לילות) - אדרשפאך, נאחוד, Hospital Kuks
- יום אחרון: סיור בפראג

אטרקציות עיקריות: סלעי אדרשפאך (⭐⭐⭐⭐⭐), קניון אדמונד - שייט (⭐⭐⭐⭐⭐), שביל צמרות העצים, טירת טרוסקי, iQLANDIA, מפל מומלבסקי, טירת נאחוד עם דובים, Hospital Kuks

המטבע המקומי: קרונה צ'כית (CZK). 1 CZK ≈ 0.157 ILS. 1 EUR ≈ 25.2 CZK.

ענה תמיד בעברית. היה ידידותי, תן המלצות פרקטיות, והתמקד בטיפים שיעזרו למשפחה עם ילדים. אם שואלים על מסעדות, הפנה למסעדות ידידותיות לילדים. אם שואלים על מזג אוויר, ציין שסוף מרץ-תחילת אפריל יכול להיות קר (5-15°C) עם אפשרות לגשם.`;

function parseId(id: string) {
  const n = parseInt(id);
  if (isNaN(n)) return null;
  return n;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/trip-days", async (_req, res) => { res.json(await storage.getTripDays()); });
  app.post("/api/trip-days", async (req, res) => {
    const p = insertTripDaySchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createTripDay(p.data));
  });
  app.patch("/api/trip-days/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateTripDay(id, req.body));
  });
  app.delete("/api/trip-days/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteTripDay(id);
    res.status(204).send();
  });

  app.get("/api/trip-days/:id/events", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.getDayEvents(id));
  });
  app.post("/api/day-events", async (req, res) => {
    const p = insertDayEventSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createDayEvent(p.data));
  });
  app.patch("/api/day-events/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateDayEvent(id, req.body));
  });
  app.delete("/api/day-events/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteDayEvent(id);
    res.status(204).send();
  });

  app.get("/api/trip-days/:id/attractions", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.getAttractions(id));
  });
  app.post("/api/attractions", async (req, res) => {
    const p = insertAttractionSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createAttraction(p.data));
  });
  app.patch("/api/attractions/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateAttraction(id, req.body));
  });
  app.delete("/api/attractions/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteAttraction(id);
    res.status(204).send();
  });

  app.get("/api/accommodations", async (_req, res) => { res.json(await storage.getAccommodations()); });
  app.post("/api/accommodations", async (req, res) => {
    const p = insertAccommodationSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createAccommodation(p.data));
  });
  app.patch("/api/accommodations/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateAccommodation(id, req.body));
  });
  app.delete("/api/accommodations/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteAccommodation(id);
    res.status(204).send();
  });

  app.get("/api/photos", async (_req, res) => { res.json(await storage.getPhotos()); });
  app.post("/api/photos", async (req, res) => {
    const p = insertPhotoSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createPhoto(p.data));
  });
  app.post("/api/photos/upload", upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      const caption = req.body.caption || "";
      const uploadedBy = req.body.uploadedBy ? parseInt(req.body.uploadedBy) : null;
      const category = req.body.category || "general";
      const photo = await storage.createPhoto({ url, caption, uploadedBy, category });
      res.status(201).json(photo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.delete("/api/photos/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const photos = await storage.getPhotos();
    const photo = photos.find((p) => p.id === id);
    if (photo && photo.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), photo.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await storage.deletePhoto(id);
    res.status(204).send();
  });

  app.get("/api/currency-rates", async (_req, res) => { res.json(await storage.getCurrencyRates()); });

  app.get("/api/tips", async (_req, res) => { res.json(await storage.getTips()); });
  app.post("/api/tips", async (req, res) => {
    const p = insertTipSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createTip(p.data));
  });
  app.patch("/api/tips/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateTip(id, req.body));
  });
  app.delete("/api/tips/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteTip(id);
    res.status(204).send();
  });

  app.get("/api/family-members", async (_req, res) => { res.json(await storage.getFamilyMembers()); });
  app.post("/api/family-members", async (req, res) => {
    const p = insertFamilyMemberSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createFamilyMember(p.data));
  });
  app.patch("/api/family-members/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateFamilyMember(id, req.body));
  });
  app.delete("/api/family-members/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteFamilyMember(id);
    res.status(204).send();
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openrouter.chat.completions.create({
        model: "openrouter/auto",
        messages: [
          { role: "system", content: TRIP_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        max_tokens: 2048,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message || "שגיאה" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: error.message || "Chat failed" });
      }
    }
  });

  return httpServer;
}