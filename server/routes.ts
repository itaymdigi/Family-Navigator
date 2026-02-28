import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertTripDaySchema, insertDayEventSchema, insertAttractionSchema,
  insertAccommodationSchema, insertPhotoSchema, insertTipSchema,
  insertFamilyMemberSchema, insertMapLocationSchema, insertTravelDocumentSchema,
  insertRestaurantSchema,
  tripDays, dayEvents, attractions, accommodations, tips, users,
  photos, currencyRates, restaurants,
} from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import bcrypt from "bcryptjs";
import { getUncachableGoogleDriveClient } from "./googleDrive";

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

function getOpenRouterClient() {
  const userKey = process.env.OPENROUTER_API_KEY;
  const apiKey = userKey || process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const baseURL = userKey
    ? "https://openrouter.ai/api/v1"
    : process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  return new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://replit.com",
      "X-Title": "Czech Trip Planner",
    },
  });
}

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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName } = req.body;
      if (!username || !password || !displayName) return res.status(400).json({ message: "כל השדות נדרשים" });
      if (password.length < 4) return res.status(400).json({ message: "סיסמה חייבת להכיל לפחות 4 תווים" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ message: "שם משתמש כבר קיים" });
      const hashed = await bcrypt.hash(password, 10);
      const allUsers = await db.select().from(users);
      const role = allUsers.length === 0 ? "admin" : "viewer";
      const user = await storage.createUser({ username, password: hashed, displayName, role });
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: "שם משתמש וסיסמה נדרשים" });
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "לא מחובר" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "לא מחובר" });
    res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "התנתקת בהצלחה" });
    });
  });

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

  // Map Locations
  app.get("/api/map-locations", async (_req, res) => { res.json(await storage.getMapLocations()); });
  app.post("/api/map-locations", async (req, res) => {
    const p = insertMapLocationSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createMapLocation(p.data));
  });
  app.patch("/api/map-locations/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateMapLocation(id, req.body));
  });
  app.delete("/api/map-locations/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteMapLocation(id);
    res.status(204).send();
  });

  // Travel Documents
  app.get("/api/travel-documents", async (_req, res) => { res.json(await storage.getTravelDocuments()); });
  app.post("/api/travel-documents", async (req, res) => {
    const p = insertTravelDocumentSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createTravelDocument(p.data));
  });
  app.patch("/api/travel-documents/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateTravelDocument(id, req.body));
  });
  app.delete("/api/travel-documents/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteTravelDocument(id);
    res.status(204).send();
  });

  // Restaurants
  app.get("/api/restaurants", async (_req, res) => { res.json(await storage.getRestaurants()); });
  app.post("/api/restaurants", async (req, res) => {
    const p = insertRestaurantSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ message: p.error.message });
    res.status(201).json(await storage.createRestaurant(p.data));
  });
  app.patch("/api/restaurants/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    res.json(await storage.updateRestaurant(id, req.body));
  });
  app.delete("/api/restaurants/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteRestaurant(id);
    res.status(204).send();
  });

  // Get all attractions (for map view)
  app.get("/api/all-attractions", async (_req, res) => {
    const days = await storage.getTripDays();
    const allAttractions = [];
    for (const day of days) {
      const attrs = await storage.getAttractions(day.id);
      allAttractions.push(...attrs.map(a => ({ ...a, dayNumber: day.dayNumber, dayTitle: day.title })));
    }
    res.json(allAttractions);
  });

  // Google Drive Integration
  app.get("/api/gdrive/files", async (req, res) => {
    try {
      const drive = await getUncachableGoogleDriveClient();
      const folderId = req.query.folderId as string || "root";
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, modifiedTime, size)",
        orderBy: "folder,name",
        pageSize: 50,
      });
      res.json(response.data.files || []);
    } catch (error: any) {
      console.error("Google Drive error:", error.message);
      res.status(500).json({ message: error.message || "Failed to list files" });
    }
  });

  app.get("/api/gdrive/search", async (req, res) => {
    try {
      const drive = await getUncachableGoogleDriveClient();
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ message: "Query required" });
      const response = await drive.files.list({
        q: `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, modifiedTime, size)",
        orderBy: "modifiedTime desc",
        pageSize: 20,
      });
      res.json(response.data.files || []);
    } catch (error: any) {
      console.error("Google Drive search error:", error.message);
      res.status(500).json({ message: error.message || "Search failed" });
    }
  });

  const CHAT_MODELS = [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-4b:free",
    "nvidia/nemotron-nano-9b-v2:free",
  ];

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "messages array required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const openrouter = getOpenRouterClient();
      let stream = null;
      let lastError: any = null;

      for (const model of CHAT_MODELS) {
        try {
          stream = await openrouter.chat.completions.create({
            model,
            messages: [
              { role: "system", content: TRIP_SYSTEM_PROMPT },
              ...messages,
            ],
            stream: true,
            max_tokens: 2048,
          });
          break;
        } catch (err: any) {
          lastError = err;
          if (err.status === 429) {
            await new Promise(r => setTimeout(r, 2000));
          }
          continue;
        }
      }

      if (!stream) throw lastError || new Error("All models unavailable");

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Chat error:", error.message);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "הבוט עמוס כרגע, נסו שוב בעוד כמה שניות" })}\n\n`);
        res.end();
      } else {
        res.status(429).json({ message: "הבוט עמוס כרגע, נסו שוב בעוד כמה שניות" });
      }
    }
  });

  async function autoSeedIfEmpty() {
    try {
      let seedPath = path.join(process.cwd(), "server", "seed-data.json");
      if (!fs.existsSync(seedPath)) {
        seedPath = path.join(__dirname, "seed-data.json");
      }
      if (!fs.existsSync(seedPath)) {
        seedPath = path.join(process.cwd(), "dist", "server", "seed-data.json");
      }
      if (!fs.existsSync(seedPath)) return;

      const existing = await db.select().from(tripDays);
      if (existing.length > 0) return;

      console.log("[seed] Database empty, auto-seeding...");
      const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

      const tableOrder = ["trip_days", "day_events", "attractions", "accommodations", "photos", "currency_rates", "tips", "restaurants"];
      const tableMap: Record<string, any> = {
        trip_days: tripDays,
        day_events: dayEvents,
        attractions: attractions,
        accommodations: accommodations,
        photos: photos,
        currency_rates: currencyRates,
        tips: tips,
        restaurants: restaurants,
      };

      function snakeToCamel(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          result[camelKey] = value;
        }
        return result;
      }

      for (const tableName of tableOrder) {
        const table = tableMap[tableName];
        const rows = seedData[tableName];
        if (!rows || rows.length === 0) continue;

        for (const row of rows) {
          const camelRow = snakeToCamel(row);
          const { id, createdAt, ...data } = camelRow;
          await db.insert(table).values(data);
        }
        console.log(`[seed] ${tableName}: ${rows.length} rows`);
      }
      console.log("[seed] Auto-seed complete!");
    } catch (e: any) {
      console.error("[seed] Auto-seed error:", e.message);
    }
  }

  autoSeedIfEmpty();

  return httpServer;
}