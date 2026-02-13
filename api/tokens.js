export default async function handler(req, res) {
  const { collection } = req.query;

  const url = `https://api.reservoir.tools/tokens/v6?collection=${collection}&limit=50&includeAttributes=false`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": process.env.RESERVOIR_API_KEY
    }
  });

  const data = await response.json();

  const items = (data.tokens || []).map(t => ({
    name: t.token.name,
    image: t.token.image,
    opensea_url: t.token.openseaUrl,
    createdAt: t.token.lastSale?.timestamp || t.token.createdAt,
    isMinted: true
  }));

  res.status(200).json({ items });
}

