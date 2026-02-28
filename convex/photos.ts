import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("photos"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      storageId: v.optional(v.id("_storage")),
      url: v.string(),
      caption: v.string(),
      uploadedBy: v.optional(v.id("users")),
      category: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("photos")
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
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    caption: v.string(),
    category: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, { tripId, storageId, url, caption, category }) => {
    const userId = await requireAuth(ctx);
    let photoUrl = url;
    if (storageId) {
      const storedUrl = await ctx.storage.getUrl(storageId);
      if (!storedUrl) throw new Error("Failed to get URL for uploaded file");
      photoUrl = storedUrl;
    }
    if (!photoUrl) throw new Error("Either storageId or url must be provided");
    return await ctx.db.insert("photos", {
      tripId,
      storageId,
      url: photoUrl,
      caption,
      category,
      uploadedBy: userId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const photo = await ctx.db.get(id);
    if (photo?.storageId) {
      await ctx.storage.delete(photo.storageId);
    }
    await ctx.db.delete(id);
    return null;
  },
});
