import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("accommodations"),
      _creationTime: v.number(),
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
      reservationStorageId: v.optional(v.id("_storage")),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("accommodations")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
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
    reservationStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("accommodations"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("accommodations", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("accommodations"),
    name: v.optional(v.string()),
    stars: v.optional(v.number()),
    description: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    dates: v.optional(v.string()),
    baseName: v.optional(v.string()),
    isSelected: v.optional(v.boolean()),
    reservationUrl: v.optional(v.string()),
    reservationName: v.optional(v.string()),
    reservationStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, { id, reservationStorageId, ...fields }) => {
    await requireAdmin(ctx);
    if (reservationStorageId) {
      const url = await ctx.storage.getUrl(reservationStorageId);
      if (url) fields.reservationUrl = url;
    }
    await ctx.db.patch(id, { ...fields, reservationStorageId });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("accommodations") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (doc?.reservationStorageId) {
      await ctx.storage.delete(doc.reservationStorageId);
    }
    await ctx.db.delete(id);
    return null;
  },
});
