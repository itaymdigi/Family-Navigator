import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("tips"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      icon: v.string(),
      text: v.string(),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx, { tripId }) => {
    const tips = await ctx.db
      .query("tips")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
    return tips.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    icon: v.string(),
    text: v.string(),
    sortOrder: v.number(),
  },
  returns: v.id("tips"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("tips", args);
  },
});

export const remove = mutation({
  args: { id: v.id("tips") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
