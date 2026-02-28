import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("currencyRates"),
      _creationTime: v.number(),
      fromCurrency: v.string(),
      toCurrency: v.string(),
      rate: v.number(),
      flag: v.string(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("currencyRates").collect();
  },
});

export const seed = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("currencyRates").collect();
    if (existing.length > 0) {
      return null;
    }
    const defaultRates = [
      { fromCurrency: "ILS", toCurrency: "CZK", rate: 6.37, flag: "🇮🇱" },
      { fromCurrency: "EUR", toCurrency: "CZK", rate: 25.2, flag: "🇪🇺" },
      { fromCurrency: "USD", toCurrency: "CZK", rate: 23.1, flag: "🇺🇸" },
      { fromCurrency: "CZK", toCurrency: "ILS", rate: 0.157, flag: "🇨🇿" },
    ];
    for (const rate of defaultRates) {
      await ctx.db.insert("currencyRates", rate);
    }
    return null;
  },
});
