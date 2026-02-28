import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const listByConversation = query({
  args: { conversationId: v.id("conversations") },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      conversationId: v.id("conversations"),
      role: v.string(),
      content: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { conversationId }) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    return msgs.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, { conversationId, role, content }) => {
    await requireAuth(ctx);
    return await ctx.db.insert("messages", {
      conversationId,
      role,
      content,
      createdAt: Date.now(),
    });
  },
});
