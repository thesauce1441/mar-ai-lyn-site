export default async function handler(req, res) {
  try {
    const urlObj = new URL(req.url, "https://example.com");
    const collection = urlObj.searchParams.get("collection") || "mar-ai-lyn";

    const url = `https://api.reservoir.tools/tokens/v6?collection=${encodeURIComponent(collection)}&limit=50&includeAttributes=false`;

    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.RESERVOIR_API_KEY
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "Reservoir request failed",
        status: response.status,
        details: text
      });
    }

    const data = await response.json();

    const items = (data.tokens || []).map(t => ({
      name: t.token?.name || "",
      image: t.token?.image || "",
      opensea_url: t.token?.openseaUrl || "",
      createdAt: t.token?.createdAt || "",
      isMinted: true
    }));

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
