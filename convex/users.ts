import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const hasUsers = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(1);
    return users.length > 0;
  },
});

export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
      displayName: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
