import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const listByDay = query({
  args: { dayId: v.id("tripDays") },
  returns: v.array(
    v.object({
      _id: v.id("attractions"),
      _creationTime: v.number(),
      dayId: v.id("tripDays"),
      name: v.string(),
      description: v.string(),
      duration: v.optional(v.string()),
      price: v.optional(v.string()),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
      mapsUrl: v.optional(v.string()),
      wazeUrl: v.optional(v.string()),
      badges: v.optional(v.array(v.string())),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { dayId }) => {
    return await ctx.db
      .query("attractions")
      .withIndex("by_day", (q) => q.eq("dayId", dayId))
      .collect();
  },
});

export const create = mutation({
  args: {
    dayId: v.id("tripDays"),
    name: v.string(),
    description: v.string(),
    duration: v.optional(v.string()),
    price: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    badges: v.optional(v.array(v.string())),
    image: v.optional(v.string()),
  },
  returns: v.id("attractions"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("attractions", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("attractions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.string()),
    price: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    badges: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("attractions") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});
