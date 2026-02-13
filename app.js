function $(id){ return document.getElementById(id); }

const STATE = {
  data: null,
  items: [],
  sort: "newest",      // newest | oldest
  mintedOnly: false,
  compact: false,
  search: ""
};

function formatDate(iso){
  if(!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
}

function setPills(count, modeText){
  $("pillCount").textContent = `${count} piece${count === 1 ? "" : "s"}`;
  $("pillMode").textContent = modeText;
}

function applySiteMeta(site){
  document.title = site.title || "MAR-AI-LYN";
  $("siteTitle").textContent = site.title || "MAR-AI-LYN";
  $("siteTag").textContent = site.tagline || "Pop • Process • Archive";
  $("headline").textContent = site.headline || "MAR-AI-LYN";

  $("btnOpenSea").href = site.opensea_collection_url || "https://opensea.io/collection/mar-ai-lyn";
  $("btnTransient").href = site.transient_hub_url || "https://www.transient.xyz/%40Andrewribt";

  const linkButtons = $("linkButtons");
  linkButtons.innerHTML = "";
  (site.links || []).forEach(l => {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = l.label;
    linkButtons.appendChild(a);
  });

  $("footerNote").textContent = site.auto?.enabled ? "Auto: ON" : "Auto: OFF";
}

function buildCard(item){
  const a = document.createElement("a");
  a.className = "card";
  a.href = item.opensea_url || item.market?.openseaUrl || "https://opensea.io/collection/mar-ai-lyn";
  a.target = "_blank";
  a.rel = "noreferrer";

  const img = document.createElement("img");
  img.className = "thumb";
  img.loading = "lazy";
  img.src = item.image || item.token?.image || item.media || "";
  img.alt = item.title || item.name || "MAR-AI-LYN";

  const body = document.createElement("div");
  body.className = "card__body";

  const top = document.createElement("div");
  top.className = "card__top";

  const title = document.createElement("div");
  title.className = "card__title";
  title.textContent = item.title || item.name || "(untitled)";

  const date = document.createElement("div");
  date.className = "card__date";
  date.textContent = formatDate(item.date || item.updatedAt || item.createdAt || "");

  top.appendChild(title);
  top.appendChild(date);

  const tags = document.createElement("div");
  tags.className = "tags";
  (item.tags || item.collection?.name ? [item.collection?.name].filter(Boolean) : [])
    .slice(0, 6)
    .forEach(t => {
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      tags.appendChild(s);
    });

  // minted badge
  const foot = document.createElement("div");
  foot.className = "card__foot";

  const badge = document.createElement("span");
  badge.className = "badge";
  const minted = (item.minted === true) || (item.isMinted === true) || (item.token?.isMinted === true);
  badge.textContent = minted ? "Minted" : "Unminted";

  const os = document.createElement("span");
  os.className = "os";
  os.textContent = "OpenSea ↗";

  foot.appendChild(badge);
  foot.appendChild(os);

  body.appendChild(top);
  if(tags.childNodes.length) body.appendChild(tags);
  body.appendChild(foot);

  a.appendChild(img);
  a.appendChild(body);

  return a;
}

function applyFilters(items){
  const q = (STATE.search || "").trim().toLowerCase();

  let out = items.slice();

  if (STATE.mintedOnly){
    out = out.filter(x => (x.minted === true) || (x.isMinted === true) || (x.token?.isMinted === true));
  }

  if (q){
    out = out.filter(x => {
      const t = (x.title || x.name || "").toLowerCase();
      return t.includes(q);
    });
  }

  out.sort((a,b) => {
    const da = new Date(a.date || a.updatedAt || a.createdAt || 0).getTime();
    const db = new Date(b.date || b.updatedAt || b.createdAt || 0).getTime();
    return STATE.sort === "newest" ? (db - da) : (da - db);
  });

  return out;
}

function render(){
  const grid = $("grid");
  const empty = $("emptyState");

  const filtered = applyFilters(STATE.items);
  setPills(filtered.length, STATE.data.site.auto?.enabled ? "Auto-loaded" : "Manual");

  grid.innerHTML = "";
  empty.hidden = filtered.length > 0;

  // “compact view” just increases density by shrinking cards via class toggle
  grid.style.gridTemplateColumns = STATE.compact
    ? "repeat(auto-fill, minmax(170px, 1fr))"
    : "repeat(auto-fill, minmax(220px, 1fr))";

  filtered.forEach(item => grid.appendChild(buildCard(item)));
}

function renderDrops(){
  const wrap = $("dropsList");
  wrap.innerHTML = "";

  const drops = (STATE.data.drops || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));

  drops.forEach(d => {
    const row = document.createElement("div");
    row.className = "row";

    const left = document.createElement("div");
    const a = document.createElement("a");
    a.href = d.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = d.title;

    left.appendChild(a);

    const meta = document.createElement("div");
    meta.className = "row__meta";
    meta.textContent = formatDate(d.date);

    row.appendChild(left);
    row.appendChild(meta);
    wrap.appendChild(row);
  });
}

function wireUI(){
  $("toggleSort").addEventListener("click", () => {
    STATE.sort = STATE.sort === "newest" ? "oldest" : "newest";
    $("toggleSort").textContent = `Sort: ${STATE.sort === "newest" ? "Newest" : "Oldest"}`;
    render();
  });

  $("toggleMinted").addEventListener("click", () => {
    STATE.mintedOnly = !STATE.mintedOnly;
    $("toggleMinted").textContent = `Minted: ${STATE.mintedOnly ? "Yes" : "All"}`;
    render();
  });

  $("toggleCompact").addEventListener("click", () => {
    STATE.compact = !STATE.compact;
    $("toggleCompact").textContent = `View: ${STATE.compact ? "Compact" : "Grid"}`;
    render();
  });

  $("searchInput").addEventListener("input", (e) => {
    STATE.search = e.target.value || "";
    render();
  });

  $("year").textContent = new Date().getFullYear();
}

async function loadDataJson(){
  const res = await fetch("./data.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Could not load data.json");
  return res.json();
}

/**
 * AUTO MODE
 * We call your own backend endpoint (so you can keep the API key private).
 * - If you haven't set it up yet, it will fail and we fall back to manual.
 */
async function loadAutoTokens(){
  const site = STATE.data.site;
  const base = site.auto?.apiBase || "/api";
  const slug = site.auto?.collectionSlug || "mar-ai-lyn";

  const url = `${base}/tokens?collection=${encodeURIComponent(slug)}`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("Auto endpoint not available yet");
  const payload = await res.json();
  return payload.items || [];
}

function loadFallback(){
  // You can keep a few manual items here for safety / while setting up auto.
  const fallback = STATE.data.archive_fallback || [];
  return fallback.map(x => ({
    title: x.title,
    date: x.date,
    image: x.image,
    opensea_url: x.opensea_url,
    minted: x.minted,
    tags: x.tags
  }));
}

async function boot(){
  STATE.data = await loadDataJson();
  applySiteMeta(STATE.data.site || {});
  wireUI();
  renderDrops();

  // Try auto first; fall back to manual
  if (STATE.data.site.auto?.enabled){
    try{
      const items = await loadAutoTokens();
      STATE.items = items;
      $("footerNote").textContent = "Auto: ON";
      setPills(items.length, "Auto-loaded");
      render();
      return;
    }catch(err){
      console.warn("Auto load failed, using fallback.", err);
      $("footerNote").textContent = "Auto: OFF (fallback)";
    }
  }

  STATE.items = loadFallback();
  setPills(STATE.items.length, "Manual");
  render();
}

boot().catch(err => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#fff;font-family:ui-monospace,monospace;padding:20px">BOOT ERROR: ${String(err)}</pre>`;
});
