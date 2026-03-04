import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";

export const tripSearch = query({
  args: { tripId: v.id("trips"), q: v.string() },
  returns: v.object({
    days: v.array(v.object({
      _id: v.id("tripDays"),
      dayNumber: v.number(),
      title: v.string(),
      date: v.string(),
    })),
    attractions: v.array(v.object({
      _id: v.id("attractions"),
      name: v.string(),
      description: v.string(),
      dayNumber: v.number(),
      dayTitle: v.string(),
    })),
    restaurants: v.array(v.object({
      _id: v.id("restaurants"),
      name: v.string(),
      cuisine: v.optional(v.string()),
    })),
    hotels: v.array(v.object({
      _id: v.id("accommodations"),
      name: v.string(),
      dates: v.string(),
    })),
    tips: v.array(v.object({
      _id: v.id("tips"),
      icon: v.string(),
      text: v.string(),
    })),
  }),
  handler: async (ctx, { tripId, q }) => {
    await requireAuth(ctx);
    const term = q.trim().toLowerCase();
    if (term.length < 2) {
      return { days: [], attractions: [], restaurants: [], hotels: [], tips: [] };
    }

    // Fetch all data in parallel
    const [days, allRestaurants, allHotels, allTips] = await Promise.all([
      ctx.db.query("tripDays").withIndex("by_trip", (qb) => qb.eq("tripId", tripId)).collect(),
      ctx.db.query("restaurants").withIndex("by_trip", (qb) => qb.eq("tripId", tripId)).collect(),
      ctx.db.query("accommodations").withIndex("by_trip", (qb) => qb.eq("tripId", tripId)).collect(),
      ctx.db.query("tips").withIndex("by_trip", (qb) => qb.eq("tripId", tripId)).collect(),
    ]);

    const matchingDays = days
      .filter(
        (d) =>
          d.title.toLowerCase().includes(term) ||
          d.subtitle?.toLowerCase().includes(term) ||
          d.notes?.some((n) => n.toLowerCase().includes(term))
      )
      .map((d) => ({ _id: d._id, dayNumber: d.dayNumber, title: d.title, date: d.date }));

    // Fetch all attractions for all days in parallel (one query per day → parallel)
    const attractionsByDay = await Promise.all(
      days.map((day) =>
        ctx.db
          .query("attractions")
          .withIndex("by_day", (qb) => qb.eq("dayId", day._id))
          .collect()
          .then((attrs) => ({ day, attrs }))
      )
    );

    const attractions: Array<{ _id: Id<"attractions">; name: string; description: string; dayNumber: number; dayTitle: string }> = [];
    for (const { day, attrs } of attractionsByDay) {
      for (const a of attrs) {
        if (
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          a.badges?.some((b) => b.toLowerCase().includes(term))
        ) {
          attractions.push({ _id: a._id, name: a.name, description: a.description, dayNumber: day.dayNumber, dayTitle: day.title });
        }
      }
    }

    return {
      days: matchingDays,
      attractions,
      restaurants: allRestaurants
        .filter((r) =>
          r.name.toLowerCase().includes(term) ||
          r.cuisine?.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term) ||
          r.address?.toLowerCase().includes(term)
        )
        .map((r) => ({ _id: r._id, name: r.name, cuisine: r.cuisine })),
      hotels: allHotels
        .filter((h) =>
          h.name.toLowerCase().includes(term) ||
          h.description.toLowerCase().includes(term)
        )
        .map((h) => ({ _id: h._id, name: h.name, dates: h.dates })),
      tips: allTips
        .filter((t) => t.text.toLowerCase().includes(term))
        .map((t) => ({ _id: t._id, icon: t.icon, text: t.text })),
    };
  },
});
