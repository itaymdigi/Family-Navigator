import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("trips"),
      _creationTime: v.number(),
      name: v.string(),
      destination: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      coverEmoji: v.optional(v.string()),
      createdBy: v.id("users"),
    })
  ),
  handler: async (ctx) => {
    await requireAuth(ctx);
    // All authenticated users can see all trips
    return await ctx.db.query("trips").collect();
  },
});

export const get = query({
  args: { id: v.id("trips") },
  returns: v.union(
    v.object({
      _id: v.id("trips"),
      _creationTime: v.number(),
      name: v.string(),
      destination: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      coverEmoji: v.optional(v.string()),
      createdBy: v.id("users"),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    destination: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverEmoji: v.optional(v.string()),
  },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    return await ctx.db.insert("trips", {
      ...args,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("trips"),
    name: v.optional(v.string()),
    destination: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    coverEmoji: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});

export const duplicate = mutation({
  args: { id: v.id("trips") },
  returns: v.id("trips"),
  handler: async (ctx, { id }) => {
    const userId = await requireAdmin(ctx);
    const trip = await ctx.db.get(id);
    if (!trip) throw new Error("Trip not found");

    const newTripId = await ctx.db.insert("trips", {
      name: `${trip.name} (עותק)`,
      destination: trip.destination,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverEmoji: trip.coverEmoji,
      createdBy: userId,
    });

    // Copy days + nested content
    const days = await ctx.db.query("tripDays").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const day of days) {
      const newDayId = await ctx.db.insert("tripDays", {
        tripId: newTripId,
        dayNumber: day.dayNumber,
        date: day.date,
        title: day.title,
        subtitle: day.subtitle,
        rating: day.rating,
        mapsUrl: day.mapsUrl,
        notes: day.notes,
        weatherIcon: day.weatherIcon,
        weatherTemp: day.weatherTemp,
        weatherDesc: day.weatherDesc,
      });
      const events = await ctx.db.query("dayEvents").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect();
      for (const e of events) {
        await ctx.db.insert("dayEvents", { dayId: newDayId, time: e.time, title: e.title, description: e.description, sortOrder: e.sortOrder });
      }
      const attrs = await ctx.db.query("attractions").withIndex("by_day", (q) => q.eq("dayId", day._id)).collect();
      for (const a of attrs) {
        await ctx.db.insert("attractions", { dayId: newDayId, name: a.name, description: a.description, duration: a.duration, price: a.price, lat: a.lat, lng: a.lng, mapsUrl: a.mapsUrl, wazeUrl: a.wazeUrl, badges: a.badges });
      }
    }

    // Copy hotels (skip file storage refs)
    const hotels = await ctx.db.query("accommodations").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const h of hotels) {
      await ctx.db.insert("accommodations", { tripId: newTripId, name: h.name, stars: h.stars, description: h.description, priceRange: h.priceRange, lat: h.lat, lng: h.lng, mapsUrl: h.mapsUrl, wazeUrl: h.wazeUrl, dates: h.dates, baseName: h.baseName, isSelected: h.isSelected, reservationUrl: h.reservationUrl, reservationName: h.reservationName });
    }

    // Copy restaurants (skip image storage refs)
    const restaurants = await ctx.db.query("restaurants").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const r of restaurants) {
      await ctx.db.insert("restaurants", { tripId: newTripId, name: r.name, cuisine: r.cuisine, priceRange: r.priceRange, rating: r.rating, address: r.address, lat: r.lat, lng: r.lng, mapsUrl: r.mapsUrl, wazeUrl: r.wazeUrl, notes: r.notes, isKosher: r.isKosher, isVisited: false });
    }

    const tips = await ctx.db.query("tips").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const t of tips) {
      await ctx.db.insert("tips", { tripId: newTripId, icon: t.icon, text: t.text, sortOrder: t.sortOrder });
    }

    const checklist = await ctx.db.query("checklistItems").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const c of checklist) {
      await ctx.db.insert("checklistItems", { tripId: newTripId, title: c.title, isDone: false, dueDate: c.dueDate, note: c.note, sortOrder: c.sortOrder });
    }

    const packing = await ctx.db.query("packingItems").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const p of packing) {
      await ctx.db.insert("packingItems", { tripId: newTripId, name: p.name, category: p.category, isPacked: false, assignedTo: p.assignedTo, quantity: p.quantity });
    }

    const members = await ctx.db.query("familyMembers").withIndex("by_trip", (q) => q.eq("tripId", id)).collect();
    for (const m of members) {
      await ctx.db.insert("familyMembers", { tripId: newTripId, name: m.name, avatar: m.avatar, color: m.color });
    }

    return newTripId;
  },
});

// Internal version for seeding — bypasses auth checks
export const internalCreate = internalMutation({
  args: {
    name: v.string(),
    destination: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverEmoji: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("trips", args);
  },
});
