import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: { tripId: v.id("trips") },
  returns: v.array(
    v.object({
      _id: v.id("familyMembers"),
      _creationTime: v.number(),
      tripId: v.id("trips"),
      name: v.string(),
      avatar: v.optional(v.string()),
      color: v.string(),
    })
  ),
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("familyMembers")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    avatar: v.optional(v.string()),
    color: v.string(),
  },
  returns: v.id("familyMembers"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("familyMembers", args);
  },
});

export const remove = mutation({
  args: { id: v.id("familyMembers") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
