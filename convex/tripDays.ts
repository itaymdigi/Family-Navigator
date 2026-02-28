import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("tripDays"),
      _creationTime: v.number(),
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
    })
  ),
  handler: async (ctx, { tripId }) => {
    const days = await ctx.db
      .query("tripDays")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
    return days.sort((a, b) => a.dayNumber - b.dayNumber);
  },
});

export const get = query({
  args: { id: v.id("tripDays") },
  returns: v.union(
    v.object({
      _id: v.id("tripDays"),
      _creationTime: v.number(),
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
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
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
  },
  returns: v.id("tripDays"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("tripDays", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tripDays"),
    dayNumber: v.optional(v.number()),
    date: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    rating: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    notes: v.optional(v.array(v.string())),
    weatherIcon: v.optional(v.string()),
    weatherTemp: v.optional(v.string()),
    weatherDesc: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tripDays") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
