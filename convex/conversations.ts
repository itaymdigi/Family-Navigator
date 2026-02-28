import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("conversations"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      title: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    title: v.string(),
  },
  returns: v.id("conversations"),
  handler: async (ctx, { tripId, title }) => {
    await requireAuth(ctx);
    return await ctx.db.insert("conversations", {
      tripId,
      title,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
