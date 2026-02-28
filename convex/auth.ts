import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }
      // First user to register gets admin role
      const existingUsers = await ctx.db.query("users").collect();
      const role = existingUsers.length === 0 ? "admin" : "viewer";
      const profile = args.profile as {
        email?: string;
        name?: string;
        image?: string;
        emailVerified?: boolean;
      };
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
