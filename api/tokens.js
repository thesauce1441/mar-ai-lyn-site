// api/tokens.js
export default async function handler(req, res) {
  try {
    // Read query safely in Vercel
    const base = `https://${req.headers.host}`;
    const u = new URL(req.url, base);
    const collection = u.searchParams.get("collection") || "mar-ai-lyn";

    const upstream =
      `https://api.reservoir.tools/tokens/v6?collection=${encodeURIComponent(collection)}` +
      `&limit=50&includeAttributes=false`;

    const apiKey = process.env.RESERVOIR_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing RESERVOIR_API_KEY env var" });
    }

    const r = await fetch(upstream, {
      headers: { "x-api-key": apiKey }
    });

    const raw = await r.text();

    // If Reservoir returns an error, show it directly
    if (!r.ok) {
      return res.status(r.status).json({
        error: "Reservoir request failed",
        status: r.status,
        upstream,
        details: raw
      });
    }

    const data = JSON.parse(raw);

    const items = (data.tokens || [])
      .map((x) => {
        const t = x.token || {};
        return {
          name: t.name || "",
          image: t.image || t.imageSmall || t.imageLarge || "",
          opensea_url: t.openseaUrl || ""
        };
      })
      .filter((i) => i.image && i.opensea_url);

    return res.status(200).json({ items, count: items.length });
  } catch (e) {
    return res.status(500).json({
      error: "Function crashed",
      message: String(e)
    });
  }
}
