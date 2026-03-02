import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAuth } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("packingItems"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      name: v.string(),
      category: v.string(),
      isPacked: v.boolean(),
      assignedTo: v.optional(v.string()),
      quantity: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("packingItems")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    category: v.string(),
    assignedTo: v.optional(v.string()),
    quantity: v.optional(v.number()),
  },
  returns: v.id("packingItems"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("packingItems", { ...args, isPacked: false });
  },
});

export const togglePacked = mutation({
  args: { id: v.id("packingItems"), isPacked: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, isPacked }) => {
    await requireAuth(ctx);
    await ctx.db.patch(id, { isPacked });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("packingItems") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
