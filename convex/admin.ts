import { action, internalQuery, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId, createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const checkIsAdmin = internalQuery({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.role === "admin";
  },
});

export const listUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
      displayName: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") throw new ConvexError("Admin required");
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      _creationTime: u._creationTime,
      name: u.name,
      email: u.email,
      role: u.role,
      displayName: u.displayName,
    }));
  },
});

export const createUser = action({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("admin"), v.literal("viewer")),
  },
  returns: v.null(),
  handler: async (ctx, { username, password, displayName, role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const isAdmin = await ctx.runQuery(internal.admin.checkIsAdmin, { userId });
    if (!isAdmin) throw new ConvexError("Admin required");

    const email = username.includes("@")
      ? username.toLowerCase().trim()
      : `${username.toLowerCase().trim()}@family.nav`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createAccount(ctx as any, {
      provider: "password",
      account: { id: email, secret: password },
      profile: { email, name: displayName, role },
    });
    return null;
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new ConvexError("Unauthorized");
    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.role !== "admin") throw new ConvexError("Admin required");
    if (userId === currentUserId) throw new ConvexError("לא ניתן למחוק את עצמך");
    await ctx.db.delete(userId);
    return null;
  },
});
