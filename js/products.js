document.addEventListener("DOMContentLoaded", init);

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg || "";
}

function debounce(fn, delay = 350) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function init() {
  const categorySelect = document.getElementById("categorySelect");
  const filterInput = document.getElementById("filterInput");
  const sortSelect = document.getElementById("sortSelect");

  const retrieveBtn = document.getElementById("retrieveBtn");

  try {
    setStatus("Loading categories...");
    const categories = await getAllCategories();

    while (categorySelect.options.length > 1) categorySelect.remove(1);

    for (const c of categories) {
      const opt = document.createElement("option");
      opt.value = (typeof c === "string") ? c : c.value;
      opt.textContent = (typeof c === "string") ? c : c.label;
      categorySelect.appendChild(opt);
    }
    setStatus("");
  } catch (e) {
    setStatus(`Category load failed: ${e.message}`);
  }

  const runSearch = async () => {
    const q = filterInput.value || "";
    const category = categorySelect.value || "all";
    const sort = sortSelect.value || "none";
    await loadAndRender({ q, category, sort });
  };

  categorySelect.addEventListener("change", runSearch);
  sortSelect.addEventListener("change", runSearch);

  const debouncedSearch = debounce(runSearch, 350);
  filterInput.addEventListener("input", debouncedSearch);

  if (retrieveBtn) retrieveBtn.addEventListener("click", runSearch);

  await loadAndRender({ q: "", category: "all", sort: "none" });
}

async function loadAndRender({ q, category, sort }) {
  try {
    setStatus("Loading products...");
    const products = await getProducts({ q, category, sort, limit: 100 });
    renderGrid(products);
    setStatus(`Showing ${products.length} products.`);
  } catch (e) {
    renderGrid([]);
    setStatus(`Product load failed: ${e.message}`);
  }
}

function resolveDetailPageHref(productId) {

  return `product-detail.html?id=${encodeURIComponent(productId)}`;
}

function renderGrid(products) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (const p of products) {
    const href = resolveDetailPageHref(p.id);

    const card = document.createElement("div");
    card.className = "card";

    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      window.location.href = href;
    });

    const link = document.createElement("a");
    link.href = href;
    link.style.display = "block"; 
    link.addEventListener("click", (e) => e.stopPropagation());

    const img = document.createElement("img");
    img.className = "thumb";
    img.src = p.thumbnail || (p.images && p.images[0]) || "";
    img.alt = p.title || "product";
    link.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "title";
    title.textContent = p.title ?? "";
    body.appendChild(title);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = p.description ?? "";
    body.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "meta";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `$${Number(p.price ?? 0).toFixed(2)}`;

    const rating = document.createElement("div");
    rating.className = "rating";
    const r = Number(p.rating ?? 0).toFixed(1);
    const ratingCount = p.reviews?.length ?? p.ratingCount ?? p.stock ?? 0;
    rating.textContent = `⭐ ${r} (${ratingCount})`;

    meta.appendChild(price);
    meta.appendChild(rating);
    body.appendChild(meta);

    card.appendChild(link);
    card.appendChild(body);
    grid.appendChild(card);
  }
}
