import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const listByDay = query({
  args: { dayId: v.id("tripDays") },
  returns: v.array(
    v.object({
      _id: v.id("dayEvents"),
      _creationTime: v.number(),
      dayId: v.id("tripDays"),
      time: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      sortOrder: v.number(),
    })
  ),
  handler: async (ctx, { dayId }) => {
    const events = await ctx.db
      .query("dayEvents")
      .withIndex("by_day", (q) => q.eq("dayId", dayId))
      .collect();
    return events.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const create = mutation({
  args: {
    dayId: v.id("tripDays"),
    time: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id("dayEvents"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("dayEvents", args);
  },
});

export const remove = mutation({
  args: { id: v.id("dayEvents") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
