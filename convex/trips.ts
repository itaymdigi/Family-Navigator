import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("trips"),
      _creationTime: v.number(),
      name: v.string(),
      destination: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      coverEmoji: v.optional(v.string()),
      createdBy: v.id("users"),
    })
  ),
  handler: async (ctx) => {
    await requireAuth(ctx);
    // All authenticated users can see all trips
    return await ctx.db.query("trips").collect();
  },
});

export const get = query({
  args: { id: v.id("trips") },
  returns: v.union(
    v.object({
      _id: v.id("trips"),
      _creationTime: v.number(),
      name: v.string(),
      destination: v.string(),
      description: v.optional(v.string()),
      startDate: v.string(),
      endDate: v.string(),
      coverEmoji: v.optional(v.string()),
      createdBy: v.id("users"),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    destination: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverEmoji: v.optional(v.string()),
  },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    return await ctx.db.insert("trips", {
      ...args,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("trips"),
    name: v.optional(v.string()),
    destination: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    coverEmoji: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("trips") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
    return null;
  },
});

// Internal version for seeding — bypasses auth checks
export const internalCreate = internalMutation({
  args: {
    name: v.string(),
    destination: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    coverEmoji: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  returns: v.id("trips"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("trips", args);
  },
});
