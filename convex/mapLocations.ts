import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("mapLocations"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      name: v.string(),
      description: v.optional(v.string()),
      lat: v.number(),
      lng: v.number(),
      type: v.string(),
      icon: v.optional(v.string()),
      dayId: v.optional(v.id("tripDays")),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("mapLocations")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    description: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    icon: v.optional(v.string()),
    dayId: v.optional(v.id("tripDays")),
  },
  returns: v.id("mapLocations"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("mapLocations", args);
  },
});

export const remove = mutation({
  args: { id: v.id("mapLocations") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
