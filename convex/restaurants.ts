import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("restaurants"),
      _creationTime: v.number(),
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
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
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
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("restaurants", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("restaurants"),
    name: v.optional(v.string()),
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
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
