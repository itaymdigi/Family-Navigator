import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Override users table to add role and displayName
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    displayName: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Top-level trips table (new - supports multi-trip)
  trips: defineTable({
    name: v.string(),
    destination: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverEmoji: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_creator", ["createdBy"]),

  // Trip days
  tripDays: defineTable({
    tripId: v.id("trips"),
    dayNumber: v.number(),
    date: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    rating: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    notes: v.optional(v.array(v.string())),
    weatherIcon: v.optional(v.string()),
    weatherTemp: v.optional(v.string()),
    weatherDesc: v.optional(v.string()),
  }).index("by_trip", ["tripId"]),

  // Day events
  dayEvents: defineTable({
    dayId: v.id("tripDays"),
    time: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_day", ["dayId"]),

  // Attractions
  attractions: defineTable({
    dayId: v.id("tripDays"),
    name: v.string(),
    description: v.string(),
    duration: v.optional(v.string()),
    price: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    badges: v.optional(v.array(v.string())),
    image: v.optional(v.string()),
  }).index("by_day", ["dayId"]),

  // Accommodations
  accommodations: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    stars: v.number(),
    description: v.string(),
    priceRange: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    dates: v.string(),
    baseName: v.optional(v.string()),
    isSelected: v.optional(v.boolean()),
    reservationUrl: v.optional(v.string()),
    reservationName: v.optional(v.string()),
  }).index("by_trip", ["tripId"]),

  // Restaurants
  restaurants: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    cuisine: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    rating: v.optional(v.number()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isKosher: v.optional(v.boolean()),
    isVisited: v.optional(v.boolean()),
    image: v.optional(v.string()),
  }).index("by_trip", ["tripId"]),

  // Family members
  familyMembers: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    avatar: v.optional(v.string()),
    color: v.string(),
  }).index("by_trip", ["tripId"]),

  // Photos (Convex file storage)
  photos: defineTable({
    tripId: v.id("trips"),
    storageId: v.optional(v.id("_storage")),
    url: v.string(),
    caption: v.string(),
    uploadedBy: v.optional(v.id("users")),
    category: v.optional(v.string()),
  }).index("by_trip", ["tripId"]),

  // Currency rates (global)
  currencyRates: defineTable({
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
    flag: v.string(),
  }),

  // Tips
  tips: defineTable({
    tripId: v.id("trips"),
    icon: v.string(),
    text: v.string(),
    sortOrder: v.number(),
  }).index("by_trip", ["tripId"]),

  // Map locations
  mapLocations: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    description: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    icon: v.optional(v.string()),
    dayId: v.optional(v.id("tripDays")),
  }).index("by_trip", ["tripId"]),

  // Travel documents
  travelDocuments: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    type: v.string(),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_trip", ["tripId"]),

  // AI conversations
  conversations: defineTable({
    tripId: v.id("trips"),
    title: v.string(),
    createdAt: v.number(),
  }).index("by_trip", ["tripId"]),

  // Chat messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
