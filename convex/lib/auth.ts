import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return userId;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);
  if (!user || (user as { role?: string }).role !== "admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return userId;
}
