import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

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

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    type: v.string(),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id("travelDocuments"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("travelDocuments", args);
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
    await ctx.db.delete(id);
    return null;
  },
});
