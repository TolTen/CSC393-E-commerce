const API_BASE = "https://dummyjson.com";

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch (_) {}
    throw new Error(`GET ${url} -> ${res.status}. ${body}`);
  }

  return res.json();
}

async function apiPost(path, bodyObj) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj),
  });

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch (_) {}
    throw new Error(`POST ${url} -> ${res.status}. ${body}`);
  }

  return res.json();
}

async function getAllCategories() {
  const data = await apiGet("/products/categories");

  if (Array.isArray(data) && (data.length === 0 || typeof data[0] === "string")) {
    return data.map(s => ({ value: s, label: s }));
  }

  if (Array.isArray(data) && typeof data[0] === "object" && data[0] !== null) {
    return data.map(obj => ({
      value: obj.slug ?? obj.name ?? String(obj),
      label: obj.name ?? obj.slug ?? String(obj),
    }));
  }

  return [];
}


async function getProducts({ q = "", category = "all", sort = "none", limit = 100 } = {}) {
  const query = (q || "").trim();
  let path;

  if (query.length > 0) {
    path = `/products/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  } else if (category !== "all") {
    path = `/products/category/${encodeURIComponent(category)}?limit=${limit}`;
  } else {
    path = `/products?limit=${limit}`;
  }

  if (sort === "price-asc") path += (path.includes("?") ? "&" : "?") + "sortBy=price&order=asc";
  if (sort === "price-desc") path += (path.includes("?") ? "&" : "?") + "sortBy=price&order=desc";

  const data = await apiGet(path);
  let products = data.products ?? [];

  if (query.length > 0 && category !== "all") {
    const cat = category.toLowerCase();
    products = products.filter(p => String(p.category || "").toLowerCase() === cat);
  }

  return products;
}

async function getProductById(id) {
  return apiGet(`/products/${encodeURIComponent(id)}`);
}

async function addToCart({ userId = 1, productId, quantity }) {
  return apiPost("/carts/add", {
    userId,
    products: [{ id: productId, quantity }],
  });
}
