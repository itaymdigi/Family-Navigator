import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("travelDocuments"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      name: v.string(),
      type: v.string(),
      url: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")),
      notes: v.optional(v.string()),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx, { tripId }) => {
    const docs = await ctx.db
      .query("travelDocuments")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
    return docs.sort((a, b) => a.sortOrder - b.sortOrder);
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
    type: v.string(),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id("travelDocuments"),
  handler: async (ctx, { tripId, storageId, url, ...rest }) => {
    await requireAdmin(ctx);
    let docUrl = url;
    if (storageId) {
      const stored = await ctx.storage.getUrl(storageId);
      if (!stored) throw new Error("Failed to get URL for uploaded file");
      docUrl = stored;
    }
    return await ctx.db.insert("travelDocuments", { tripId, storageId, url: docUrl, ...rest });
  },
});

export const update = mutation({
  args: {
    id: v.id("travelDocuments"),
    url: v.optional(v.string()),
    name: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("travelDocuments") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (doc?.storageId) {
      await ctx.storage.delete(doc.storageId);
    }
    await ctx.db.delete(id);
    return null;
  },
});
