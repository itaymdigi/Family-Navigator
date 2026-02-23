# Family Trip Companion App

## Overview
A mobile-responsive web app for family trip planning and documentation. Features saved attractions with Google Maps navigation, a photo gallery, and a multi-currency converter.

## Architecture
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + wouter routing
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack React Query

## Design System ("Soft Pop")
- **Primary**: Coral (#FF6B6B)
- **Secondary**: Turquoise (#4ECDC4)
- **Accent**: Sunny Yellow (#FFE66D)
- **Success**: Mint (#95E1D3)
- **Typography**: Poppins (headings) + Inter (UI)
- **Layout**: Mobile-first, max-w-md, card-based, bottom navigation

## Data Model
- `places` — saved attractions (name, location, type, image, lat/lng)
- `photos` — trip gallery (url, caption)
- `currency_rates` — exchange rates (from/to currency, rate, flag emoji)

## API Routes
- `GET /api/places` — list all saved places
- `POST /api/places` — add a new place
- `DELETE /api/places/:id` — remove a place
- `GET /api/photos` — list all photos
- `POST /api/photos` — add a new photo
- `DELETE /api/photos/:id` — remove a photo
- `GET /api/currency-rates` — list all exchange rates

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod validation
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface (DatabaseStorage)
- `server/routes.ts` — Express API routes
- `client/src/pages/Home.tsx` — Main app page (Places, Photos, Currency views)
- `client/src/index.css` — Design system tokens + Tailwind config