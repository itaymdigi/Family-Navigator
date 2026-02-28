import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

function wmoToDisplay(code: number): { icon: string; desc: string } {
  if (code === 0) return { icon: "☀️", desc: "שמשי" };
  if (code <= 2) return { icon: "🌤️", desc: "מעונן חלקית" };
  if (code === 3) return { icon: "☁️", desc: "מעונן" };
  if (code <= 48) return { icon: "🌫️", desc: "ערפל" };
  if (code <= 67) return { icon: "🌧️", desc: "גשם" };
  if (code <= 77) return { icon: "🌨️", desc: "שלג" };
  if (code <= 86) return { icon: "🌦️", desc: "מקלחות גשם" };
  return { icon: "⛈️", desc: "סופת רעמים" };
}

function dateInRange(date: string, rangeStr: string): boolean {
  // rangeStr format: "25.3–30.3" or "25.3-30.3"
  const normalized = rangeStr.replace("–", "-");
  const parts = normalized.split("-");
  if (parts.length < 2) return false;

  const parseDate = (s: string, year: number) => {
    const [d, m] = s.trim().split(".").map(Number);
    if (!d || !m) return null;
    return new Date(year, m - 1, d);
  };

  const refDate = new Date(date);
  const year = refDate.getFullYear();
  const start = parseDate(parts[0], year);
  const end = parseDate(parts[1], year);
  if (!start || !end) return false;
  return refDate >= start && refDate <= end;
}

export const fetchForDay = action({
  args: { tripId: v.id("trips"), dayId: v.id("tripDays") },
  returns: v.null(),
  handler: async (ctx, { tripId, dayId }) => {
    const day = await ctx.runQuery(api.tripDays.get, { id: dayId });
    if (!day) return null;

    const accommodations = await ctx.runQuery(api.accommodations.list, { tripId });
    const hotel = accommodations.find((h) => dateInRange(day.date, h.dates));
    const lat = hotel?.lat ?? 50.65;
    const lng = hotel?.lng ?? 15.5;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&start_date=${day.date}&end_date=${day.date}`
    );
    const data = await res.json() as {
      daily: {
        weathercode: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
      };
    };
    const code = data.daily.weathercode[0];
    const max = Math.round(data.daily.temperature_2m_max[0]);
    const min = Math.round(data.daily.temperature_2m_min[0]);
    const { icon, desc } = wmoToDisplay(code);

    await ctx.runMutation(api.tripDays.update, {
      id: dayId,
      weatherIcon: icon,
      weatherTemp: `${min}–${max}°C`,
      weatherDesc: desc,
    });
    return null;
  },
});
