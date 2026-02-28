import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const TRIP_SYSTEM_PROMPT = `אתה מדריך טיולים וירטואלי מומחה לצפון צ'כיה. אתה עוזר למשפחה ישראלית (2 מבוגרים + 2 ילדים גילאי 11-14) שנוסעת לטיול בצפון צ'כיה בין 25.3 ל-4.4.2026.

פרטי הטיול:
- בסיס 1: ליברץ (3 לילות) - iQLANDIA, קניון אדמונד, טירות גן עדן בוהמי
- בסיס 2: שפינדלרוב מלין, OREA Resort (2 לילות) - מפלים, שביל צמרות העצים
- בסיס 3: Apartmán v tichu, טפליצה (3 לילות) - אדרשפאך, נאחוד, Hospital Kuks
- יום אחרון: סיור בפראג

אטרקציות עיקריות: סלעי אדרשפאך (⭐⭐⭐⭐⭐), קניון אדמונד - שייט (⭐⭐⭐⭐⭐), שביל צמרות העצים, טירת טרוסקי, iQLANDIA, מפל מומלבסקי, טירת נאחוד עם דובים, Hospital Kuks

המטבע המקומי: קרונה צ'כית (CZK). 1 CZK ≈ 0.157 ILS. 1 EUR ≈ 25.2 CZK.

ענה תמיד בעברית. היה ידידותי, תן המלצות פרקטיות, והתמקד בטיפים שיעזרו למשפחה עם ילדים. אם שואלים על מסעדות, הפנה למסעדות ידידותיות לילדים. אם שואלים על מזג אוויר, ציין שסוף מרץ-תחילת אפריל יכול להיות קר (5-15°C) עם אפשרות לגשם.`;

const chatAction = httpAction(async (_ctx, request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { messages } = (await request.json()) as {
      messages: Array<{ role: string; content: string }>;
    };

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: TRIP_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        `data: ${JSON.stringify({ error })}\n\n`,
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    // Stream the response back
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({ content })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response(
      `data: ${JSON.stringify({ error: "Internal server error" })}\n\n`,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
        },
      }
    );
  }
});

const http = httpRouter();

// Register Convex Auth HTTP routes
auth.addHttpRoutes(http);

http.route({ path: "/api/chat", method: "POST", handler: chatAction });
http.route({ path: "/api/chat", method: "OPTIONS", handler: chatAction });

export default http;
