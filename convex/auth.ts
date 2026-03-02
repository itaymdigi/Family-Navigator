import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        // Block login if admin deleted this user
        const existing = await ctx.db.get(args.existingUserId);
        if (!existing) throw new ConvexError("החשבון הוסר על ידי מנהל המערכת");
        return args.existingUserId;
      }
      const profile = args.profile as {
        email?: string;
        name?: string;
        image?: string;
        emailVerified?: boolean;
        role?: "admin" | "viewer";
      };
      // Use role from profile (admin-created users), otherwise first=admin rest=viewer
      let role = profile.role;
      if (!role) {
        const existingUsers = await ctx.db.query("users").collect();
        role = existingUsers.length === 0 ? "admin" : "viewer";
      }
      return ctx.db.insert("users", {
        email: profile.email,
        name: profile.name,
        image: profile.image,
        role,
        displayName: profile.name ?? "משתמש",
      });
    },
  },
});

export { getAuthUserId };
