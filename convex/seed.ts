import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Internal mutation to insert a trip day and return its ID
export const insertTripDay = internalMutation({
  args: {
    tripId: v.id("trips"),
    dayNumber: v.number(),
    date: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    rating: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    notes: v.optional(v.array(v.string())),
    weatherIcon: v.optional(v.string()),
    weatherTemp: v.optional(v.string()),
    weatherDesc: v.optional(v.string()),
  },
  returns: v.id("tripDays"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tripDays", args);
  },
});

export const insertDayEvent = internalMutation({
  args: {
    dayId: v.id("tripDays"),
    time: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  },
  returns: v.id("dayEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("dayEvents", args);
  },
});

export const insertAttraction = internalMutation({
  args: {
    dayId: v.id("tripDays"),
    name: v.string(),
    description: v.string(),
    duration: v.optional(v.string()),
    price: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    badges: v.optional(v.array(v.string())),
    image: v.optional(v.string()),
  },
  returns: v.id("attractions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("attractions", args);
  },
});

export const insertAccommodation = internalMutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    stars: v.number(),
    description: v.string(),
    priceRange: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    dates: v.string(),
    baseName: v.optional(v.string()),
    isSelected: v.optional(v.boolean()),
    reservationUrl: v.optional(v.string()),
    reservationName: v.optional(v.string()),
  },
  returns: v.id("accommodations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("accommodations", args);
  },
});

export const insertRestaurant = internalMutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    cuisine: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    rating: v.optional(v.number()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    wazeUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isKosher: v.optional(v.boolean()),
    isVisited: v.optional(v.boolean()),
    image: v.optional(v.string()),
  },
  returns: v.id("restaurants"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("restaurants", args);
  },
});

export const insertTip = internalMutation({
  args: {
    tripId: v.id("trips"),
    icon: v.string(),
    text: v.string(),
    sortOrder: v.number(),
  },
  returns: v.id("tips"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("tips", args);
  },
});

export const insertCurrencyRate = internalMutation({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
    rate: v.number(),
    flag: v.string(),
  },
  returns: v.id("currencyRates"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("currencyRates", args);
  },
});

export const checkExistingTrip = internalMutation({
  args: { name: v.string() },
  returns: v.union(v.id("trips"), v.null()),
  handler: async (ctx, { name }) => {
    const existing = await ctx.db.query("trips").collect();
    const found = existing.find((t) => t.name === name);
    return found?._id ?? null;
  },
});

export const getFirstUserId = internalMutation({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(1);
    return users[0]?._id ?? null;
  },
});

export const checkCurrencyRates = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rates = await ctx.db.query("currencyRates").collect();
    return rates.length;
  },
});

export const czechTrip2026 = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if trip already exists (idempotent)
    const existingTripId = await ctx.runMutation(internal.seed.checkExistingTrip, {
      name: "Czech Republic 2026",
    });
    if (existingTripId !== null) {
      console.log("Czech Republic 2026 trip already exists, skipping seed.");
      return null;
    }

    // Get the first registered user to set as trip creator
    const createdBy = await ctx.runMutation(internal.seed.getFirstUserId, {});
    if (!createdBy) {
      console.log("No users found. Register at least one user before seeding.");
      return null;
    }

    // Create the trip
    const tripId = await ctx.runMutation(internal.trips.internalCreate, {
      name: "Czech Republic 2026",
      destination: "צפון צ'כיה",
      startDate: "2026-03-25",
      endDate: "2026-04-04",
      coverEmoji: "🇨🇿",
      createdBy,
    });

    // Map old integer day IDs to new Convex IDs
    const dayIdMap = new Map<number, string>();

    // Insert trip days
    const tripDaysData = [
      { id: 1, day_number: 0, date: "25.3", title: "נחיתה בפראג ✈️", subtitle: "רביעי 25.3", rating: null, maps_url: null, notes: ["הזמינו מלון עם שאטל חינם. רכב נלקח רק מחר בבוקר."], weather_icon: "🌥️", weather_temp: "8°C", weather_desc: "מעונן חלקית" },
      { id: 2, day_number: 1, date: "26.3", title: "פראג-מדע-מים-וילה", subtitle: "חמישי 26.3", rating: 4, maps_url: "https://www.google.com/maps/dir/Prague+International+Airport/iQLANDIA,+Nitransk%C3%A1+1,+Liberec/Aquapark+Babylon,+Nitransk%C3%A1,+Liberec/Mlad%C3%A1+800,+463+12+Liberec/@50.4,14.7,9z/data=!4m2!4m1!3e0", notes: ["כרטיס משולב iQLANDIA + אקוופארק חוסך כסף!"], weather_icon: "⛅", weather_temp: "10°C", weather_desc: "מעונן עם קרני שמש" },
      { id: 3, day_number: 2, date: "27.3", title: "שייט-טבע-טירה", subtitle: "שישי 27.3", rating: 5, maps_url: "https://www.google.com/maps/dir/Mlad%C3%A1+800,+463+12+Liberec/Edmunds+Gorge+Boats,+H%C5%99ensko/H%C5%99ensko+82,+407+17+H%C5%99ensko/D%C4%9B%C4%8D%C3%ADn+Castle/Mlad%C3%A1+800,+463+12+Liberec/@50.7,14.5,9z/data=!4m2!4m1!3e0", notes: ["סירות מ-30 במרץ בערך – בדקו שפועל ב-27.3! אם לא, שנו סדר ימים.", "יום ארוך עם נסיעה – צאו מוקדם!"], weather_icon: "🌤️", weather_temp: "12°C", weather_desc: "שמשי חלקית" },
      { id: 4, day_number: 3, date: "28.3", title: "טירות וטבע", subtitle: "שבת 28.3", rating: 4, maps_url: "https://www.google.com/maps/dir/Mlad%C3%A1+800,+463+12+Liberec/Sychrov+Castle/Hrub%C3%A1+Sk%C3%A1la+Castle/Trosky+Castle/Bozkov+Dolomite+Caves/Mlad%C3%A1+800,+463+12+Liberec/@50.6,15.1,11z/data=!4m2!4m1!3e0", notes: ["בדקו שעות פתיחה של טרוסקי – 28.3 = שבת ✅ צפוי פתוח", "יום עמוס! אפשר לוותר על בוז'קוב אם נגמר הזמן."], weather_icon: "☀️", weather_temp: "14°C", weather_desc: "שמשי ונעים" },
      { id: 5, day_number: 4, date: "29.3", title: "מפלים-מבשלת-הרים", subtitle: "ראשון 29.3", rating: 3, maps_url: "https://www.google.com/maps/dir/Mlad%C3%A1+800,+463+12+Liberec/Mumlavsk%C3%BD+vodop%C3%A1d,+Harrachov/Nov%C3%BD+Sv%C4%9Bt+95,+512+46+Harrachov/OREA+Resort+Horal,+%C5%A0pindler%C5%AFv+Ml%C3%BDn/@50.7,15.4,10z/data=!4m2!4m1!3e0", notes: ["יום רגוע יותר לפני יום שביל העצים. בדרך נופים הרריים מדהימים!"], weather_icon: "🌧️", weather_temp: "9°C", weather_desc: "גשם קל" },
      { id: 6, day_number: 5, date: "30.3", title: "שביל צמרות העצים", subtitle: "שני 30.3", rating: 4, maps_url: "https://www.google.com/maps/dir/OREA+Resort+Horal,+%C5%A0pindler%C5%AFv+Ml%C3%BDn/Treetop+Walk+Krkono%C5%A1e/OREA+Resort+Horal,+%C5%A0pindler%C5%AFv+Ml%C3%BDn/@50.7,15.6,11z/data=!4m2!4m1!3e0", notes: ["פתוח כל השנה. יתכן שלג – ביגוד חם! יום קצר = זמן לספא במלון 🧖"], weather_icon: "🌨️", weather_temp: "5°C", weather_desc: "אפשרות לשלג בהרים" },
      { id: 7, day_number: 6, date: "31.3", title: "🌟 אדרשפאך + טפליצה – יום ה-WOW!", subtitle: "שלישי 31.3", rating: 5, maps_url: "https://www.google.com/maps/dir/OREA+Resort+Horal,+%C5%A0pindler%C5%AFv+Ml%C3%BDn/Kaln%C3%A1+Voda+7,+542+23+Mlad%C3%A9+Buky/Adr%C5%A1pach+Rock+City/Teplice+Rocks/Apartm%C3%A1n+v+tichu,+Horn%C3%AD+Teplice+nad+Metuj%C3%AD/@50.6,15.9,11z/data=!4m2!4m1!3e0", notes: ["הזמינו כרטיסים לאדרשפאך אונליין מראש! הגבלת כניסה. הגיעו ב-8:30. מזומן לסירות!"], weather_icon: "⛅", weather_temp: "11°C", weather_desc: "מעונן עם התבהרויות" },
      { id: 8, day_number: 7, date: "1.4", title: "טירת נאחוד + עיירה היסטורית", subtitle: "רביעי 1.4", rating: 3, maps_url: "https://www.google.com/maps/dir/Apartm%C3%A1n+v+tichu,+Teplice+nad+Metuj%C3%AD/N%C3%A1chod+Castle/Masarykovo+n%C3%A1m%C4%9Bst%C3%AD,+N%C3%A1chod/Apartm%C3%A1n+v+tichu,+Teplice+nad+Metuj%C3%AD/@50.5,16.1,12z/data=!4m2!4m1!3e0", notes: ["הטירה פתוחה מאפריל – 1.4 היום הראשון! סיורים בצ'כית עם טקסט באנגלית.", "דובים דאשה ולודוויק חיים בחפיר הטירה – הילדים יאהבו! 🐻"], weather_icon: "🌤️", weather_temp: "13°C", weather_desc: "שמשי חלקית" },
      { id: 9, day_number: 8, date: "2.4", title: "טירת קוקס + פסלי יער בית-לחם", subtitle: "חמישי 2.4", rating: 4, maps_url: "https://www.google.com/maps/dir/Apartm%C3%A1n+v+tichu,+Teplice+nad+Metuj%C3%AD/Hospital+Kuks/Braun%C5%AFv+Betl%C3%A9m,+Stanovice/Apartm%C3%A1n+v+tichu,+Teplice+nad+Metuj%C3%AD/@50.4,15.9,11z/data=!4m2!4m1!3e0", notes: ["Kuks פתוח מאפריל – 2.4 בתוך הטווח ✅ בדקו באתר!", "בית המרקחת הבארוקי – חובה! הילדים יכולים ליצור כדורים מבצק 💊"], weather_icon: "☀️", weather_temp: "15°C", weather_desc: "שמשי ונעים" },
      { id: 10, day_number: 9, date: "3.4", title: "נסיעה לפראג + סיור בעיר", subtitle: "שישי 3.4", rating: 3, maps_url: "https://www.google.com/maps/dir/Apartm%C3%A1n+v+tichu,+Teplice+nad+Metuj%C3%AD/Old+Town+Square,+Prague/Prague+Airport/@50.3,15.0,9z/data=!4m2!4m1!3e0", notes: ["חנו ב-P+R (Park & Ride) ליד מטרו – חוסך חיפוש חניה במרכז!", "החזירו רכב בשדה → הליכה/שאטל למלון. מחר רק ללכת לטרמינל!"], weather_icon: "🌥️", weather_temp: "12°C", weather_desc: "מעונן חלקית" },
      { id: 11, day_number: 10, date: "4.4", title: "טיסה הביתה ✈️", subtitle: "שבת 4.4", rating: null, maps_url: null, notes: ["אם אין ארוחת בוקר מוקדמת – הכינו חטיפים מהערב!"], weather_icon: "⛅", weather_temp: "10°C", weather_desc: "מעונן עם קרני שמש" },
    ];

    for (const day of tripDaysData) {
      const convexId = await ctx.runMutation(internal.seed.insertTripDay, {
        tripId,
        dayNumber: day.day_number,
        date: day.date,
        title: day.title,
        subtitle: day.subtitle ?? undefined,
        rating: day.rating ?? undefined,
        mapsUrl: day.maps_url ?? undefined,
        notes: day.notes ?? undefined,
        weatherIcon: day.weather_icon ?? undefined,
        weatherTemp: day.weather_temp ?? undefined,
        weatherDesc: day.weather_desc ?? undefined,
      });
      dayIdMap.set(day.id, convexId);
    }

    // Insert day events
    const dayEventsData = [
      { day_id: 1, time: "20:55", title: "נחיתה בשדה התעופה", description: "Václav Havel Airport, פראג", sort_order: 1 },
      { day_id: 1, time: "21:30", title: "איסוף מזוודות", description: "יציאה מהטרמינל", sort_order: 2 },
      { day_id: 1, time: "22:00", title: "הגעה למלון ליד השדה", description: "Holiday Inn / Courtyard / Ramada – ישר לישון!", sort_order: 3 },
      { day_id: 2, time: "8:00", title: "ארוחת בוקר + צ'ק-אאוט", description: null, sort_order: 1 },
      { day_id: 2, time: "9:00", title: "איסוף רכב שכור", description: "בשדה התעופה", sort_order: 2 },
      { day_id: 2, time: "10:30", title: "נסיעה לליברץ", description: "~1.5 שעות", sort_order: 3 },
      { day_id: 2, time: "12:00", title: "iQLANDIA – מרכז מדע", description: "רובוט הומנואידי, סופת אש, ברקים, אימון אסטרונאוטים, רעידת אדמה", sort_order: 4 },
      { day_id: 2, time: "15:30", title: "אקוופארק Babylon", description: "מגלשות, גלים, בריכות – כיף לילדים!", sort_order: 5 },
      { day_id: 2, time: "18:00", title: "צ'ק-אין מלון ליברץ", description: "Mladá 800, Liberec", sort_order: 6 },
      { day_id: 3, time: "7:30", title: "יציאה מוקדמת!", description: "נסיעה ~1.5 שעות להרנסקו", sort_order: 1 },
      { day_id: 3, time: "9:30", title: "קניון אדמונד – שייט", description: "סירה בקניון סלע, קירות 150 מ', מפל מלאכותי", sort_order: 2 },
      { day_id: 3, time: "11:00", title: "סיור בהרנסקו", description: "כפר ציורי בקניון הלבה, קניות ואוכל", sort_order: 3 },
      { day_id: 3, time: "13:00", title: "טירת דצ'ין", description: "טירה על צוק מעל נהר הלבה, גן ורדים בארוקי", sort_order: 4 },
      { day_id: 3, time: "16:00", title: "חזרה למלון ליברץ", description: "~1.5 שעות", sort_order: 5 },
      { day_id: 4, time: "8:30", title: "נסיעה לטירת סיכרוב", description: "~30 דקות", sort_order: 1 },
      { day_id: 4, time: "9:00", title: "טירת סיכרוב", description: "ארמון ניאו-גותי ורוד! גני נוף אנגליים", sort_order: 2 },
      { day_id: 4, time: "10:30", title: "Hrubá Skála", description: "טירה על סלע אבן חול, תצפיות מרהיבות", sort_order: 3 },
      { day_id: 4, time: "13:00", title: "ארוחת צהריים", description: "מסעדת טירת Hrubá Skála", sort_order: 4 },
      { day_id: 4, time: "14:30", title: "טירת טרוסקי", description: "חורבות על 2 צוקי בזלת! טיפוס ל-\"בתולה\" ו-\"סבתא\"", sort_order: 5 },
      { day_id: 4, time: "16:00", title: "מערות בוז'קוב", description: "מערה דולומיטית, אגם תת-קרקעי, 45 דקות, 8°C", sort_order: 6 },
      { day_id: 5, time: "9:00", title: "נסיעה להאראחוב", description: "~1 שעה מליברץ", sort_order: 1 },
      { day_id: 5, time: "10:00", title: "מפל מומלבסקי", description: "המפל הגדול בצ'כיה! 10 מ' גובה, טיול קצר ביער", sort_order: 2 },
      { day_id: 5, time: "11:30", title: "מבשלת Nový Svět", description: "מבשלת בירה מקומית, טעימות, אוכל צ'כי", sort_order: 3 },
      { day_id: 5, time: "14:00", title: "נסיעה לשפינדלרוב מלין", description: "~1 שעה דרך הרי קרקונושה", sort_order: 4 },
      { day_id: 5, time: "15:30", title: "צ'ק-אין OREA Resort Horal", description: "מלון הרים, ספא ובריכה", sort_order: 5 },
      { day_id: 6, time: "9:00", title: "ארוחת בוקר", description: "OREA Resort", sort_order: 1 },
      { day_id: 6, time: "10:00", title: "נסיעה לשביל צמרות", description: "~30 דקות", sort_order: 2 },
      { day_id: 6, time: "10:30", title: "שביל צמרות העצים", description: "מגדל 45 מ', טרמפולינות רשת 20 מ', מערת שורשים, מגלשה!", sort_order: 3 },
      { day_id: 6, time: "13:00", title: "ארוחת צהריים בצמרות", description: "Restaurace V korunách", sort_order: 4 },
      { day_id: 6, time: "14:30", title: "חזרה ל-OREA Resort", description: "ספא, בריכה, מנוחה", sort_order: 5 },
      { day_id: 7, time: "8:00", title: "צ'ק-אאוט OREA + עצירה Kalná Voda", description: "~30 דקות", sort_order: 1 },
      { day_id: 7, time: "9:00", title: "🌟 סלעי אדרשפאך", description: "\"האוהבים\" 81.4 מ', \"חור העכבר\", השער הגותי, מפל 16 מ', שייט באגם!", sort_order: 2 },
      { day_id: 7, time: "12:00", title: "ארוחת צהריים", description: null, sort_order: 3 },
      { day_id: 7, time: "13:30", title: "סלעי טפליצה", description: "עיר סלעים גבוהה, מדרגות ברזל, פחות תיירים, 6 ק\"מ", sort_order: 4 },
      { day_id: 7, time: "16:30", title: "צ'ק-אין בדירה", description: "Apartmán v tichu, Teplice nad Metují", sort_order: 5 },
      { day_id: 8, time: "9:00", title: "נסיעה לנאחוד", description: "~25 דקות", sort_order: 1 },
      { day_id: 8, time: "10:00", title: "טירת נאחוד", description: "5 חצרות, מגדל תצפית, מרתפים גותיים, דובים חיים בחפיר!", sort_order: 2 },
      { day_id: 8, time: "12:30", title: "ארוחת צהריים", description: "כיכר מסאריק – מסעדות ובתי קפה", sort_order: 3 },
      { day_id: 8, time: "13:30", title: "סיור ברחובות נאחוד", description: "כנסיית סנט לורנס, בית העירייה הבארוקי", sort_order: 4 },
      { day_id: 8, time: "15:00", title: "מבשלת Primátor (אופציה)", description: "מהמבשלות המפורסמות בצ'כיה", sort_order: 5 },
      { day_id: 8, time: "16:30", title: "חזרה לדירה", description: null, sort_order: 6 },
      { day_id: 9, time: "9:00", title: "נסיעה לקוקס", description: "~45 דקות", sort_order: 1 },
      { day_id: 9, time: "10:00", title: "Hospital Kuks – סיור", description: "בארוק מרהיב! בית מרקחת מ-1743, כנסיית השילוש, קריפטה, פסלי סגולות וחטאים", sort_order: 2 },
      { day_id: 9, time: "12:00", title: "גן תבלינים + ארוחת צהריים", description: "גן בארוקי משוחזר, מסעדה ליד החניה", sort_order: 3 },
      { day_id: 9, time: "13:30", title: "Braunův Betlém – פסלים ביער", description: "טיול ביער 7 ק\"מ לפסלי בארוק חצובים בסלע! נזירים, גולגולות – יחיד מסוגו בעולם!", sort_order: 4 },
      { day_id: 9, time: "16:00", title: "חזרה לדירה", description: null, sort_order: 5 },
      { day_id: 10, time: "8:00", title: "ארוחת בוקר + צ'ק-אאוט", description: null, sort_order: 1 },
      { day_id: 10, time: "8:30", title: "נסיעה לפראג", description: "~2.5 שעות", sort_order: 2 },
      { day_id: 10, time: "11:00", title: "חניה + מטרו למרכז", description: "חניה ליד תחנת מטרו בפרבר (P+R)", sort_order: 3 },
      { day_id: 10, time: "11:30", title: "כיכר העיר העתיקה", description: "השעון האסטרונומי, כנסיית טין", sort_order: 4 },
      { day_id: 10, time: "12:30", title: "ארוחת צהריים", description: "מסעדה בעיר העתיקה", sort_order: 5 },
      { day_id: 10, time: "13:30", title: "גשר קארל (Karlův most)", description: "הגשר הגותי המפורסם בעולם! 30 פסלי קדושים", sort_order: 6 },
      { day_id: 10, time: "14:30", title: "מאלא סטראנה + טירת פראג (מבחוץ)", description: "רובע קטן, קתדרלת ויטוס מבחוץ", sort_order: 7 },
      { day_id: 10, time: "16:00", title: "חזרה לרכב", description: null, sort_order: 8 },
      { day_id: 10, time: "17:00", title: "החזרת רכב + מלון שדה", description: null, sort_order: 9 },
      { day_id: 11, time: "5:30", title: "השכמה", description: null, sort_order: 1 },
      { day_id: 11, time: "6:00", title: "ארוחת בוקר", description: "Holiday Inn מגיש מ-6:00", sort_order: 2 },
      { day_id: 11, time: "6:30", title: "הליכה לטרמינל", description: "5-10 דקות", sort_order: 3 },
      { day_id: 11, time: "7:00", title: "צ'ק-אין + ביטחון", description: null, sort_order: 4 },
      { day_id: 11, time: "9:00", title: "✈️ טיסה הביתה!", description: null, sort_order: 5 },
    ];

    for (const event of dayEventsData) {
      const convexDayId = dayIdMap.get(event.day_id);
      if (!convexDayId) continue;
      await ctx.runMutation(internal.seed.insertDayEvent, {
        dayId: convexDayId as string & { __tableName: "tripDays" },
        time: event.time,
        title: event.title,
        description: event.description ?? undefined,
        sortOrder: event.sort_order,
      });
    }

    // Insert attractions
    const attractionsData = [
      { day_id: 2, name: "iQLANDIA", description: "מרכז מדע אינטראקטיבי – מאות תערוכות, מושלם לגילאי 11-14", duration: "3 שעות", price: "~250 CZK", lat: 50.7704, lng: 15.0551, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.7704,15.0551&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.7704,15.0551&navigate=yes", badges: ["🕐 3 שעות", "💰 ~250 CZK", "👶 כל הגילים"], image: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=600&q=80" },
      { day_id: 2, name: "אקוופארק Babylon", description: "מגלשות, בריכת גלים, ספא", duration: "2 שעות", price: "~350 CZK", lat: 50.7676, lng: 15.0554, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.7676,15.0554&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.7676,15.0554&navigate=yes", badges: ["🕐 2 שעות", "💰 ~350 CZK"], image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80" },
      { day_id: 3, name: "קניון אדמונד – שייט (Edmund's Gorge)", description: "שייט בסירה בקניון סלע מרהיב, קירות עד 150 מ'", duration: "30 דקות", price: "~120 CZK", lat: 50.8747, lng: 14.2928, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.8747,14.2928&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.8747,14.2928&navigate=yes", badges: ["🕐 30 דקות", "💰 ~120 CZK", "🚣 סירה"], image: "https://images.unsplash.com/photo-1540206395-68808572332f?w=600&q=80" },
      { day_id: 3, name: "הרנסקו (Hřensko)", description: "כפר ציורי בקניון הלבה, שער שוויץ הבוהמית", duration: "1 שעה", price: null, lat: 50.8756, lng: 14.2439, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.8756,14.2439&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.8756,14.2439&navigate=yes", badges: ["🕐 1 שעה"], image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" },
      { day_id: 3, name: "טירת דצ'ין (Děčín Castle)", description: "טירה על צוק מעל נהר הלבה, גן ורדים בארוקי", duration: "1.5 שעות", price: "~150 CZK", lat: 50.7825, lng: 14.2044, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.7825,14.2044&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.7825,14.2044&navigate=yes", badges: ["🕐 1.5 שעות", "💰 ~150 CZK"], image: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&q=80" },
      { day_id: 4, name: "טירת סיכרוב (Sychrov Castle)", description: "ארמון ניאו-גותי ורוד, פנים מפוארים, גני נוף אנגליים", duration: "1 שעה", price: "~200 CZK", lat: 50.6244, lng: 15.0875, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.6244,15.0875&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.6244,15.0875&navigate=yes", badges: ["🕐 1 שעה", "💰 ~200 CZK"], image: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&q=80" },
      { day_id: 4, name: "Hrubá Skála Castle", description: "טירה על סלע אבן חול ענק בגן עדן בוהמי, תצפיות פנורמיות", duration: "1.5 שעות", price: "חינם (חצר)", lat: 50.5425, lng: 15.1883, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.5425,15.1883&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.5425,15.1883&navigate=yes", badges: ["🕐 1.5 שעות", "💰 חינם (חצר)"], image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" },
      { day_id: 4, name: "טירת טרוסקי (Trosky Castle)", description: "חורבות דרמטיות על 2 צוקי בזלת – נופים 360°", duration: "1.5 שעות", price: "~120 CZK", lat: 50.5178, lng: 15.2284, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.5178,15.2284&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.5178,15.2284&navigate=yes", badges: ["🕐 1.5 שעות", "💰 ~120 CZK"], image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=600&q=80" },
      { day_id: 4, name: "מערות בוז'קוב (Bozkov Caves)", description: "המערה היחידה הפתוחה בצפון בוהמיה – אגם תת-קרקעי", duration: "45 דקות", price: "~130 CZK", lat: 50.5864, lng: 15.3478, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.5864,15.3478&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.5864,15.3478&navigate=yes", badges: ["🕐 45 דקות", "💰 ~130 CZK", "🌡 8°C"], image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80" },
      { day_id: 6, name: "שביל צמרות העצים (Treetop Walk Krkonoše)", description: "מסלול בין צמרות העצים, מגדל 45 מ', טרמפולינות רשת 20 מ', מגלשה", duration: "2-3 שעות", price: "~350 CZK", lat: 50.6308, lng: 15.7811, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.6308,15.7811&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.6308,15.7811&navigate=yes", badges: ["🕐 2-3 שעות", "💰 ~350 CZK", "👶 כל הגילים"], image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80" },
      { day_id: 8, name: "טירת נאחוד (Náchod Castle)", description: "טירה מהמאה ה-13, 5 חצרות, מגדל, מרתפים גותיים, דובים חיים בחפיר!", duration: "2 שעות", price: "~140 CZK", lat: 50.4188, lng: 16.1617, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.4188,16.1617&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.4188,16.1617&navigate=yes", badges: ["🕐 2 שעות", "💰 ~140 CZK", "🐻 דובים!"], image: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&q=80" },
      { day_id: 8, name: "כיכר מסאריק, נאחוד", description: "כיכר היסטורית, כנסיית סנט לורנס (1310), בתי קפה ומסעדות", duration: "1.5 שעות", price: null, lat: 50.4163, lng: 16.1628, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.4163,16.1628&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.4163,16.1628&navigate=yes", badges: ["🕐 1.5 שעות"], image: null },
      { day_id: 10, name: "כיכר העיר העתיקה (Old Town Square)", description: "השעון האסטרונומי, כנסיית טין, בתי בארוק צבעוניים", duration: "1 שעה", price: null, lat: 50.0875, lng: 14.4213, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.0875,14.4213&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.0875,14.4213&navigate=yes", badges: ["🕐 1 שעה"], image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=80" },
      { day_id: 10, name: "גשר קארל (Charles Bridge)", description: "גשר גותי מהמאה ה-14, 30 פסלי קדושים, נוף על הלבה והטירה", duration: "30 דקות", price: null, lat: 50.0865, lng: 14.4114, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.0865,14.4114&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.0865,14.4114&navigate=yes", badges: ["🕐 30 דקות"], image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&q=80" },
      { day_id: 10, name: "טירת פראג (מבחוץ)", description: "מתחם הטירה הגדול בעולם, קתדרלת ויטוס", duration: "1 שעה", price: null, lat: 50.0905, lng: 14.3996, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.0905,14.3996&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.0905,14.3996&navigate=yes", badges: ["🕐 1 שעה"], image: "https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=600&q=80" },
    ];

    for (const attr of attractionsData) {
      const convexDayId = dayIdMap.get(attr.day_id);
      if (!convexDayId) continue;
      await ctx.runMutation(internal.seed.insertAttraction, {
        dayId: convexDayId as string & { __tableName: "tripDays" },
        name: attr.name,
        description: attr.description,
        duration: attr.duration ?? undefined,
        price: attr.price ?? undefined,
        lat: attr.lat ?? undefined,
        lng: attr.lng ?? undefined,
        mapsUrl: attr.maps_url ?? undefined,
        wazeUrl: attr.waze_url ?? undefined,
        badges: attr.badges ?? undefined,
        image: attr.image ?? undefined,
      });
    }

    // Insert accommodations
    const accommodationsData = [
      { name: "Ramada Prague Airport", stars: 3, description: "בתוך טרמינל 3, קבלה 24/7", price_range: "€60–90 / לילה", lat: 50.1078, lng: 14.2602, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.1078,14.2602&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.1078,14.2602&navigate=yes", dates: "25.3", base_name: "✈️ ליד שדה התעופה", is_selected: false, reservation_url: "https://drive.google.com/file/d/1_b9DG-223YWO_EYnjPyZAxsGZjoJNyOv/view?usp=drivesdk", reservation_name: "מלון 1.pdf" },
      { name: "Mladá 800, Liberec", stars: 3, description: "הדירה/צימר שהוזמן בליברץ", price_range: "✅ הוזמן", lat: 50.7681, lng: 15.0558, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.7681,15.0558&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.7681,15.0558&navigate=yes", dates: "26–29.3 (3 לילות)", base_name: "🏔 בסיס 1 – ליברץ", is_selected: true, reservation_url: "https://drive.google.com/file/d/1iTHVHR8jqzaluA7mfNTo37k1j3CAVaMz/view?usp=drivesdk", reservation_name: "מלון2.pdf" },
      { name: "OREA Resort Horal", stars: 4, description: "מלון הרים עם ספא ובריכה", price_range: "✅ הוזמן", lat: 50.7249, lng: 15.6067, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.7249,15.6067&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.7249,15.6067&navigate=yes", dates: "29–31.3 (2 לילות)", base_name: "⛰ בסיס 2 – Špindlerův Mlýn", is_selected: true, reservation_url: "https://drive.google.com/file/d/1ldvzIYurWdYrGjNnSGwXkDqmROQqr7fA/view?usp=drivesdk", reservation_name: "מלון 3.pdf" },
      { name: "Apartmán v tichu", stars: 4, description: "דירה שקטה ליד סלעי טפליצה", price_range: "✅ הוזמן", lat: 50.595, lng: 16.17, maps_url: "https://www.google.com/maps/dir/?api=1&destination=50.595,16.17&travelmode=driving", waze_url: "https://www.waze.com/ul?ll=50.595,16.17&navigate=yes", dates: "31.3–3.4 (3 לילות)", base_name: "🪨 בסיס 3 – Teplice nad Metují", is_selected: true, reservation_url: "https://drive.google.com/file/d/1MyDwPatjAKtfeUKD3YXhoKLkOZavQz2g/view?usp=drivesdk", reservation_name: "מלון4.pdf" },
    ];

    for (const acc of accommodationsData) {
      await ctx.runMutation(internal.seed.insertAccommodation, {
        tripId,
        name: acc.name,
        stars: acc.stars,
        description: acc.description,
        priceRange: acc.price_range ?? undefined,
        lat: acc.lat ?? undefined,
        lng: acc.lng ?? undefined,
        mapsUrl: acc.maps_url ?? undefined,
        wazeUrl: acc.waze_url ?? undefined,
        dates: acc.dates,
        baseName: acc.base_name ?? undefined,
        isSelected: acc.is_selected ?? undefined,
        reservationUrl: acc.reservation_url ?? undefined,
        reservationName: acc.reservation_name ?? undefined,
      });
    }

    // Insert restaurants
    const restaurantsData = [
      { name: "Hospoda Domov", cuisine: null, price_range: null, rating: null, address: "Ještědská 149, 460 08 Liberec", lat: 50.7575, lng: 15.0468, maps_url: null, waze_url: null, notes: "טברנה היסטורית הפועלת למעלה ממאה שנה, ששימשה בעבר כתחנת מעבר לכרכרות בדרך לגרמניה ופולין. מגישה אוכל צ'כי מסורתי וטעים באווירה מיוחדת, ויש בה גם תפריט ילדים נהדר", is_kosher: false, is_visited: false, image: null },
      { name: "Radniční sklípek", cuisine: null, price_range: null, rating: null, address: "Dětenice 1, Dětenice, 507 24", lat: 50.3847, lng: 15.1722, maps_url: null, waze_url: null, notes: "חוויה אדירה שילדים ומבוגרים לא ישכחו! הפונדק מואר בנרות בלבד ואוכלים בו בשרים הנצלים על אש גלויה בידיים חשופות (בלי סכו\"ם). במהלך הארוחה יש הופעות של פאקירים, יורקי אש, קרבות חרבות ושפה \"חצופה\" של המלצרים כנהוג בימי הביניים", is_kosher: false, is_visited: false, image: null },
      { name: "Mexická restaurace Jičín", cuisine: null, price_range: null, rating: null, address: "Nerudova 82, 506 01 Jičín 1", lat: 50.4374, lng: 15.3514, maps_url: null, waze_url: null, notes: "מסעדה מקסיקנית פופולרית מאוד הממוקמת בעיירה איצ'ין. היא מגישה אוכל בסגנון מקסיקני מותאם לחך המקומי, וידועה במנות גדולות ונדיבות מאוד (כמו פהיטס וקסדייה) ובאווירה נעימ", is_kosher: false, is_visited: false, image: null },
      { name: "Novosad & Son (Glass Factory and Brewery)", cuisine: null, price_range: null, rating: null, address: "Nový Svět 95, 512 46 Harrachov v Krkonoších", lat: 50.7731, lng: 15.4283, maps_url: null, waze_url: null, notes: "חוויה מיוחדת במינה בהראכוב – מסעדה הממוקמת בתוך מפעל זכוכית פעיל המשולב עם מבשלת בירה. תוכלו לאכול מנות צ'כיות מסורתיות כמו צלעות ושניצל לילדים, ולשתות בירה מקומית תוך כדי צפייה באומנים מנפחים זכוכית", is_kosher: false, is_visited: false, image: null },
      { name: "SAVOYA restaurace", cuisine: null, price_range: null, rating: null, address: "Harrachova 23, 543 51 Špindlerův Mlýn", lat: 50.7262, lng: 15.6094, maps_url: null, waze_url: null, notes: "מסעדת שף יוקרתית יחסית שזכתה להמלצה מטעם מדריך מישלן היוקרתי. כל המנות בה מוכנות בקפידה וטעימות מאוד (כדאי לקחת בחשבון שהמנות אינן ענקיות).", is_kosher: false, is_visited: false, image: null },
      { name: "Bakchus Steak Restaurant & Café", cuisine: null, price_range: null, rating: null, address: "Špindlerův Mlýn 223, 543 51 Špindlerův Mlýn", lat: 50.7255, lng: 15.6085, maps_url: null, waze_url: null, notes: "סעדת בשרים וסטייקים מצוינת הממוקמת במרכז עיירת הנופש שפינדלרוב מלין. מקום נהדר לארוחה מנחמת וטעימה לכל המשפחה אחרי יום של פעילויות אקסטרים או סקי", is_kosher: false, is_visited: false, image: null },
      { name: "The Ještěd Devils (Čerti na Ještědu)", cuisine: null, price_range: null, rating: null, address: "Ještědská 202, 460 08 Liberec-Horní Hanychov", lat: 50.7335, lng: 14.9925, maps_url: null, waze_url: null, notes: "פאב-מסעדה באווירה כפרית וייחודית, המעוצב עם דמויות של שדים ומכשפות. מקום מעולה לעצירה אחרי יום טיול בהר, המציע מנות צ'כיות אותנטיות כמו ניוקי בסגנון צ'כי עם בייקון וכרוב כבוש", is_kosher: false, is_visited: false, image: null },
      { name: "Kavárna Bez konceptu", cuisine: null, price_range: null, rating: null, address: "Husova 1094/87, 460 01 Liberec", lat: 50.7671, lng: 15.0543, maps_url: null, waze_url: null, notes: "בית קפה פופולרי ומקסים, מושלם לארוחות בוקר, בראנץ' או עצירת קפה. מגיש קפה משובח, כריכים ועוגות (כמו עוגת הגבינה שלהם), ויש בו אווירה נעימה עם נוף לעבר הר יישטד", is_kosher: false, is_visited: false, image: null },
      { name: "Black Horse", cuisine: null, price_range: null, rating: null, address: "nám. Nerudovo 108, 460 01 Liberec", lat: 50.7663, lng: 15.0559, maps_url: null, waze_url: null, notes: "פאב ומסעדה אירית ברמה גבוהה המציעה אוכל אירי ואירופאי באווירה מזמינה ומתוחכמת. תוכלו למצוא כאן מנות נהדרות, בירת גינס מושלמת ושירות יוצא דופן", is_kosher: false, is_visited: false, image: null },
      { name: "Chicago Bar & Grill", cuisine: null, price_range: null, rating: null, address: "nám. Sokolovské 312/1, 460 01 Liberec", lat: 50.7677, lng: 15.0583, maps_url: null, waze_url: null, notes: "מסעדת בשרים תוססת בסגנון אמריקאי עם עיצוב תעשייתי מודרני. התפריט העשיר מציע המבורגרים מצוינים וגדולים, צלעות, כנפיים ומבחר בירות של מבשלות בוטיק. המקום אידיאלי למשפחות", is_kosher: false, is_visited: false, image: null },
      { name: "Radniční sklípek (ליברץ)", cuisine: null, price_range: null, rating: null, address: "nám. Dr. E. Beneše 1, 460 59 Liberec", lat: 50.7672, lng: 15.0564, maps_url: null, waze_url: null, notes: "מסעדה הממוקמת במרתפים ההיסטוריים מתחת לבית העירייה של ליברץ. היא מציעה חוויה אותנטית של תרבות וקולינריה צ'כית, עם מנות מסורתיות עשירות (כמו בקר בשמנת וגולאש) לצד מגוון רחב של בירות מקומיות", is_kosher: false, is_visited: false, image: null },
    ];

    for (const rest of restaurantsData) {
      await ctx.runMutation(internal.seed.insertRestaurant, {
        tripId,
        name: rest.name,
        cuisine: rest.cuisine ?? undefined,
        priceRange: rest.price_range ?? undefined,
        rating: rest.rating ?? undefined,
        address: rest.address ?? undefined,
        lat: rest.lat ?? undefined,
        lng: rest.lng ?? undefined,
        mapsUrl: rest.maps_url ?? undefined,
        wazeUrl: rest.waze_url ?? undefined,
        notes: rest.notes ?? undefined,
        isKosher: rest.is_kosher ?? undefined,
        isVisited: rest.is_visited ?? undefined,
        image: rest.image ?? undefined,
      });
    }

    // Insert tips
    const tipsData = [
      { icon: "🎟", text: "הזמינו מראש: כרטיסים לאדרשפאך (חובה!), מערת בוז'קוב", sort_order: 1 },
      { icon: "💵", text: "מזומן: כמה מאות CZK למקרה – סירות, חניונים קטנים. כרטיס אשראי עובד כמעט בכל מקום", sort_order: 2 },
      { icon: "🗺", text: "Mapy.cz – האפליקציה הצ'כית הטובה ביותר לניווט ושבילי הליכה", sort_order: 3 },
      { icon: "🗣", text: "אנגלית מוגבלת באזורים כפריים – הורידו Google Translate אופליין", sort_order: 4 },
      { icon: "🛣", text: "אגרת כביש: ודאו שהרכב כולל ויניטה אלקטרונית", sort_order: 5 },
      { icon: "🚗", text: "כבישים הרריים – נסיעה זהירה, פיתולים חדים", sort_order: 6 },
      { icon: "⏰", text: "הגיעו מוקדם לאטרקציות פופולריות – ההבדל עצום!", sort_order: 7 },
      { icon: "🎒", text: "תמיד קחו מים, פירות וחטיפים לטיולים", sort_order: 8 },
      { icon: "🏨", text: "הזמינו מלון שדה תעופה (הגעה + חזרה) מראש – מתמלאים!", sort_order: 9 },
      { icon: "📱", text: "בדקו שעות פתיחה של חברת הרכב ב-26.3 (בדר\"כ מ-8:00)", sort_order: 10 },
    ];

    for (const tip of tipsData) {
      await ctx.runMutation(internal.seed.insertTip, {
        tripId,
        icon: tip.icon,
        text: tip.text,
        sortOrder: tip.sort_order,
      });
    }

    // Seed currency rates if not already present
    const rateCount = await ctx.runMutation(internal.seed.checkCurrencyRates, {});
    if (rateCount === 0) {
      const currencyRatesData = [
        { fromCurrency: "ILS", toCurrency: "CZK", rate: 6.37, flag: "🇮🇱" },
        { fromCurrency: "EUR", toCurrency: "CZK", rate: 25.2, flag: "🇪🇺" },
        { fromCurrency: "USD", toCurrency: "CZK", rate: 23.1, flag: "🇺🇸" },
        { fromCurrency: "CZK", toCurrency: "ILS", rate: 0.157, flag: "🇨🇿" },
      ];
      for (const rate of currencyRatesData) {
        await ctx.runMutation(internal.seed.insertCurrencyRate, rate);
      }
    }

    console.log("Czech Republic 2026 trip seeded successfully!");
    return null;
  },
});
