# 🇨🇿 טיול צפון צ'כיה 2026 – Family Trip Companion

## Overview
A mobile-responsive Hebrew RTL PWA for a family trip to Northern Czech Republic (25.3–4.4.2026). Features day-by-day itinerary with timeline and weather forecasts, attractions with Google Maps/Waze navigation, accommodations overview, currency converter (CZK↔ILS, EUR↔ILS), collaborative photo gallery with file uploads, interactive map with all trip points, travel documents section, travel tips and budget estimates, and an AI chatbot (multiple free models via OpenRouter) for Czech travel advice.

## Architecture
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + wouter routing
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query
- **AI**: OpenRouter integration (fallback: Mistral → LLaMA → Qwen → Nemotron) with trip-specific Hebrew system prompt
- **PWA**: Service worker for offline caching (API responses, photos, static assets)
- **File Upload**: Multer for direct photo uploads from device
- **Map**: Leaflet.js with OpenStreetMap tiles
- **Google Drive**: Live file browser via Replit connector (googleapis)
- **Direction**: RTL (Hebrew)

## Access Control
- Admin mode protected by PIN (default: 1234)
- Lock/unlock toggle in header
- All CRUD operations (add, edit, delete) require admin mode
- View-only mode by default for all visitors

## Design System ("Soft Pop")
- **Primary**: Coral (#FF6B6B)
- **Secondary**: Turquoise (#4ECDC4)
- **Accent**: Sunny Yellow (#FFE66D)
- **Success**: Mint (#95E1D3)
- **Typography**: Poppins (headings) + Inter (UI)
- **Layout**: Mobile-first, max-w-md, card-based, bottom navigation (8 tabs)

## Data Model
- `trip_days` — day-by-day itinerary (dayNumber, date, title, subtitle, rating, mapsUrl, notes, weatherIcon, weatherTemp, weatherDesc)
- `day_events` — schedule items per day (dayId, time, title, description, sortOrder)
- `attractions` — places to visit with nav links (dayId, name, description, duration, price, lat/lng, mapsUrl, wazeUrl, badges)
- `accommodations` — hotels/apartments (name, stars, description, priceRange, lat/lng, mapsUrl, wazeUrl, dates, baseName, isSelected)
- `family_members` — family members for photo attribution (name, avatar, color)
- `photos` — trip gallery (url, caption, uploadedBy, category)
- `currency_rates` — exchange rates (fromCurrency, toCurrency, rate, flag)
- `tips` — travel tips (icon, text, sortOrder)
- `map_locations` — custom map pins (name, description, lat, lng, type, icon, dayId)
- `travel_documents` — travel docs/links (name, type, url, notes, sortOrder)
- `restaurants` — restaurant/food list (name, cuisine, priceRange, rating, address, lat/lng, mapsUrl, wazeUrl, notes, isKosher, isVisited, image)
- `conversations` / `messages` — AI chat history

## API Routes
- `GET/POST/PATCH/DELETE /api/trip-days` — CRUD for trip days
- `GET /api/trip-days/:id/events` — day events
- `GET /api/trip-days/:id/attractions` — day attractions
- `POST/PATCH/DELETE /api/day-events` — CRUD for events
- `POST/PATCH/DELETE /api/attractions` — CRUD for attractions
- `GET/POST/PATCH/DELETE /api/accommodations` — CRUD for accommodations
- `GET /api/photos`, `POST /api/photos`, `POST /api/photos/upload`, `DELETE /api/photos/:id`
- `GET /api/currency-rates` — exchange rates
- `GET/POST/PATCH/DELETE /api/tips` — CRUD for tips
- `GET/POST/PATCH/DELETE /api/family-members` — CRUD for family members
- `GET/POST/PATCH/DELETE /api/map-locations` — custom map locations
- `GET/POST/PATCH/DELETE /api/travel-documents` — travel docs
- `GET /api/all-attractions` — all attractions with day info (for map)
- `GET/POST/PATCH/DELETE /api/restaurants` — CRUD for restaurants
- `POST /api/chat` — AI chatbot (streaming SSE)
- `GET /api/gdrive/files?folderId=` — Google Drive file listing
- `GET /api/gdrive/search?q=` — Google Drive file search

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod validation
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface (DatabaseStorage)
- `server/routes.ts` — Express API routes + file upload + AI chat
- `client/src/pages/Home.tsx` — Main app (8 tabs: Itinerary, Hotels, Map, Currency, Photos, Documents, Food, Tips)
- `client/src/components/AiChatBot.tsx` — Floating AI chatbot component
- `client/src/main.tsx` — App entry + service worker registration
- `client/public/sw.js` — Service worker (offline caching)
- `client/public/manifest.json` — PWA manifest
- `client/src/index.css` — Design system tokens + Tailwind config
- `server/googleDrive.ts` — Google Drive API client (uses Replit connector, never cache client)
- `uploads/` — Directory for uploaded photo files
