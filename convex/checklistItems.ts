import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAuth } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("checklistItems"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      title: v.string(),
      isDone: v.boolean(),
      dueDate: v.optional(v.string()),
      note: v.optional(v.string()),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx, { tripId }) => {
    const items = await ctx.db
      .query("checklistItems")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    title: v.string(),
    dueDate: v.optional(v.string()),
    note: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id("checklistItems"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("checklistItems", { ...args, isDone: false });
  },
});

export const toggleDone = mutation({
  args: { id: v.id("checklistItems"), isDone: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, isDone }) => {
    await requireAuth(ctx);
    await ctx.db.patch(id, { isDone });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("checklistItems") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
