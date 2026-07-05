// Supabase Edge Function — translate
// Proxies translation requests to DeepL API v2.
//
// Deploy: supabase functions deploy translate --project-ref vfqrskzieolsqjampqih
//
// Request body: { text: string, targetLang: "JA" | "EN" }
// Response:     { translatedText: string }

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Parse body
  let text: string;
  let targetLang: string;
  try {
    const body = await req.json() as { text?: unknown; targetLang?: unknown };
    text       = typeof body.text       === "string" ? body.text.trim()       : "";
    targetLang = typeof body.targetLang === "string" ? body.targetLang.trim() : "";
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!text)       return json({ error: "text is required" },       400);
  if (!targetLang) return json({ error: "targetLang is required" }, 400);

  const apiKey = Deno.env.get("DEEPL_API_KEY");
  if (!apiKey) return json({ error: "DEEPL_API_KEY is not configured" }, 500);

  // Call DeepL API v2
  const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
    method:  "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang }),
  });

  if (!deeplRes.ok) {
    const errText = await deeplRes.text().catch(() => "");
    console.error("[translate] DeepL error:", deeplRes.status, errText);
    return json({ error: "DeepL API error", status: deeplRes.status }, 502);
  }

  const data = await deeplRes.json() as { translations?: { text: string }[] };
  const translatedText = data.translations?.[0]?.text ?? "";

  return json({ translatedText });
});
