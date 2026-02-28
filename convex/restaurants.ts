import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

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
      imageStorageId: v.optional(v.id("_storage")),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("restaurants")
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
    imageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("restaurants"),
  handler: async (ctx, { imageStorageId, ...args }) => {
    await requireAdmin(ctx);
    let image = args.image;
    if (imageStorageId) {
      const url = await ctx.storage.getUrl(imageStorageId);
      if (url) image = url;
    }
    return await ctx.db.insert("restaurants", { ...args, image, imageStorageId });
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
    imageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, { id, imageStorageId, ...fields }) => {
    await requireAdmin(ctx);
    if (imageStorageId) {
      const url = await ctx.storage.getUrl(imageStorageId);
      if (url) fields.image = url;
    }
    await ctx.db.patch(id, { ...fields, imageStorageId });
    return null;
  },
});

export const clearImage = mutation({
  args: { id: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (doc?.imageStorageId) {
      await ctx.storage.delete(doc.imageStorageId);
    }
    await ctx.db.patch(id, { image: undefined, imageStorageId: undefined });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("restaurants") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (doc?.imageStorageId) {
      await ctx.storage.delete(doc.imageStorageId);
    }
    await ctx.db.delete(id);
    return null;
  },
});
