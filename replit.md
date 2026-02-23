# 🇨🇿 טיול צפון צ'כיה 2026 – Family Trip Companion

## Overview
A mobile-responsive Hebrew RTL web app for a family trip to Northern Czech Republic (25.3–4.4.2026). Features day-by-day itinerary with timeline, attractions with Google Maps/Waze navigation, accommodations overview, currency converter (CZK↔ILS, EUR↔ILS), photo gallery, travel tips and budget estimates.

## Architecture
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + wouter routing
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query
- **Direction**: RTL (Hebrew)

## Design System ("Soft Pop")
- **Primary**: Coral (#FF6B6B)
- **Secondary**: Turquoise (#4ECDC4)
- **Accent**: Sunny Yellow (#FFE66D)
- **Success**: Mint (#95E1D3)
- **Typography**: Poppins (headings) + Inter (UI)
- **Layout**: Mobile-first, max-w-md, card-based, bottom navigation (5 tabs)

## Data Model
- `trip_days` — day-by-day itinerary (dayNumber, date, title, subtitle, rating, mapsUrl, notes)
- `day_events` — schedule items per day (dayId, time, title, description, sortOrder)
- `attractions` — places to visit with nav links (dayId, name, description, duration, price, lat/lng, mapsUrl, wazeUrl, badges)
- `accommodations` — hotels/apartments (name, stars, description, priceRange, lat/lng, mapsUrl, wazeUrl, dates, baseName, isSelected)
- `photos` — trip gallery (url, caption)
- `currency_rates` — exchange rates (fromCurrency, toCurrency, rate, flag)
- `tips` — travel tips (icon, text, sortOrder)

## API Routes
- `GET /api/trip-days` — list all days
- `GET /api/trip-days/:id/events` — get events for a day
- `GET /api/trip-days/:id/attractions` — get attractions for a day
- `GET /api/accommodations` — list accommodations
- `GET /api/photos` — list photos
- `POST /api/photos` — add a photo
- `DELETE /api/photos/:id` — remove a photo
- `GET /api/currency-rates` — list exchange rates
- `GET /api/tips` — list travel tips

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod validation
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface (DatabaseStorage)
- `server/routes.ts` — Express API routes
- `client/src/pages/Home.tsx` — Main app (Itinerary, Hotels, Currency, Photos, Tips views)
- `client/src/index.css` — Design system tokens + Tailwind config