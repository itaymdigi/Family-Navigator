# 🇨🇿 טיול צפון צ'כיה 2026 – Family Trip Companion

## Overview
A mobile-responsive Hebrew RTL PWA for a family trip to Northern Czech Republic (25.3–4.4.2026). Features day-by-day itinerary with timeline and weather forecasts, attractions with Google Maps/Waze navigation, accommodations overview, currency converter (CZK↔ILS, EUR↔ILS), collaborative photo gallery with file uploads, travel tips and budget estimates, and an AI chatbot (DeepSeek via OpenRouter) for Czech travel advice.

## Architecture
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + wouter routing
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query
- **AI**: OpenRouter integration (DeepSeek model) with trip-specific Hebrew system prompt
- **PWA**: Service worker for offline caching (API responses, photos, static assets)
- **File Upload**: Multer for direct photo uploads from device
- **Direction**: RTL (Hebrew)

## Design System ("Soft Pop")
- **Primary**: Coral (#FF6B6B)
- **Secondary**: Turquoise (#4ECDC4)
- **Accent**: Sunny Yellow (#FFE66D)
- **Success**: Mint (#95E1D3)
- **Typography**: Poppins (headings) + Inter (UI)
- **Layout**: Mobile-first, max-w-md, card-based, bottom navigation (5 tabs)

## Data Model
- `trip_days` — day-by-day itinerary (dayNumber, date, title, subtitle, rating, mapsUrl, notes, weatherIcon, weatherTemp, weatherDesc)
- `day_events` — schedule items per day (dayId, time, title, description, sortOrder)
- `attractions` — places to visit with nav links (dayId, name, description, duration, price, lat/lng, mapsUrl, wazeUrl, badges)
- `accommodations` — hotels/apartments (name, stars, description, priceRange, lat/lng, mapsUrl, wazeUrl, dates, baseName, isSelected)
- `family_members` — family members for photo attribution (name, avatar, color)
- `photos` — trip gallery (url, caption, uploadedBy)
- `currency_rates` — exchange rates (fromCurrency, toCurrency, rate, flag)
- `tips` — travel tips (icon, text, sortOrder)
- `conversations` / `messages` — AI chat history

## API Routes
- `GET/POST/PATCH/DELETE /api/trip-days` — CRUD for trip days
- `GET /api/trip-days/:id/events` — day events
- `GET /api/trip-days/:id/attractions` — day attractions
- `POST/PATCH/DELETE /api/day-events` — CRUD for events
- `POST/PATCH/DELETE /api/attractions` — CRUD for attractions
- `GET/POST/PATCH/DELETE /api/accommodations` — CRUD for accommodations
- `GET /api/photos` — list photos
- `POST /api/photos` — add photo by URL
- `POST /api/photos/upload` — upload photo file (multipart/form-data)
- `DELETE /api/photos/:id` — remove photo (also deletes file if uploaded)
- `GET /api/currency-rates` — exchange rates
- `GET/POST/PATCH/DELETE /api/tips` — CRUD for tips
- `GET/POST/PATCH/DELETE /api/family-members` — CRUD for family members
- `POST /api/chat` — AI chatbot (streaming SSE)

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod validation
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface (DatabaseStorage)
- `server/routes.ts` — Express API routes + file upload + AI chat
- `client/src/pages/Home.tsx` — Main app (Itinerary, Hotels, Currency, Photos, Tips views)
- `client/src/components/AiChatBot.tsx` — Floating AI chatbot component
- `client/src/main.tsx` — App entry + service worker registration
- `client/public/sw.js` — Service worker (offline caching)
- `client/public/manifest.json` — PWA manifest
- `client/src/index.css` — Design system tokens + Tailwind config
- `uploads/` — Directory for uploaded photo files