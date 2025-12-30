document.addEventListener("DOMContentLoaded", init);

let product = null;

function el(id) { return document.getElementById(id); }
function setStatus(msg) { const s = el("status"); if (s) s.textContent = msg || ""; }

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function safe(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  return String(v);
}

function formatDimensions(dim) {
  if (!dim) return "N/A";
  if (typeof dim === "object") {
    const w = dim.width ?? dim.w;
    const h = dim.height ?? dim.h;
    const d = dim.depth ?? dim.d;
    if (w || h || d) return `${w ?? "?"} x ${h ?? "?"} x ${d ?? "?"}`;
  }
  return safe(dim);
}

let toastTimer = null;

function showToast(message) {
  const t = el("toast");
  if (!t) return;

  t.textContent = message;
  t.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
}

function updateTotal() {
  if (!product) return;

  const qtyInput = el("qtyInput");
  if (!qtyInput) return;

  const qty = Math.max(1, Number(qtyInput.value || 1));
  qtyInput.value = String(qty);

  const totalEl = el("totalPrice");
  if (totalEl) totalEl.textContent = `$${(Number(product.price || 0) * qty).toFixed(2)}`;
}

function renderReviews(reviews) {
  const container = el("reviews");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(reviews) || reviews.length === 0) {
    container.textContent = "No reviews.";
    return;
  }

  for (const r of reviews) {
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <div class="review-head">
        <strong>${safe(r.reviewerName || r.user || "Anonymous")}</strong>
        <span>⭐ ${safe(r.rating ?? "")}</span>
      </div>
      <div class="review-body">${safe(r.comment || r.body || "")}</div>
    `;
    container.appendChild(item);
  }
}

function setupQtyButtons() {
  const qtyInput = el("qtyInput");
  const minusBtn = el("qtyMinus");
  const plusBtn = el("qtyPlus");

  if (!qtyInput) return;

  qtyInput.addEventListener("input", () => {
    const n = Number(qtyInput.value);
    if (!Number.isFinite(n) || n < 1) qtyInput.value = "1";
    updateTotal();
  });

  if (minusBtn) {
    minusBtn.addEventListener("click", () => {
      const current = Math.max(1, Number(qtyInput.value || 1));
      qtyInput.value = String(Math.max(1, current - 1));
      updateTotal();
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener("click", () => {
      const current = Math.max(1, Number(qtyInput.value || 1));
      qtyInput.value = String(current + 1);
      updateTotal();
    });
  }
}

async function init() {
  const id = getIdFromUrl();
  if (!id) {
    setStatus("Missing product id in URL. (Expected ?id=123)");
    console.error("Missing id param. URL:", window.location.href);
    return;
  }

  setupQtyButtons();

  try {
    setStatus("Loading product...");
    product = await getProductById(id);
    setStatus("");

    const imgEl = el("productImage");
    if (imgEl) {
      imgEl.src = product.thumbnail || (product.images && product.images[0]) || "";
      imgEl.alt = product.title || "product";
    }

    if (el("title")) el("title").textContent = product.title || "";
    if (el("description")) el("description").textContent = product.description || "";

    if (el("rating")) el("rating").textContent = `⭐ ${Number(product.rating ?? 0).toFixed(1)}`;

    const ratingCount = product.reviews?.length ?? product.ratingCount ?? product.stock ?? 0;
    if (el("ratingCount")) el("ratingCount").textContent = `Rating count: ${ratingCount}`;

    if (el("price")) el("price").textContent = `$${Number(product.price ?? 0).toFixed(2)}`;

    if (el("brand")) el("brand").textContent = safe(product.brand);
    if (el("weight")) el("weight").textContent = safe(product.weight);
    if (el("dimensions")) el("dimensions").textContent = formatDimensions(product.dimensions);
    if (el("warranty")) el("warranty").textContent = safe(product.warrantyInformation);
    if (el("shipping")) el("shipping").textContent = safe(product.shippingInformation);
    if (el("availability")) el("availability").textContent = safe(product.availabilityStatus);
    if (el("returnPolicy")) el("returnPolicy").textContent = safe(product.returnPolicy);
    if (el("minOrderQty")) el("minOrderQty").textContent = safe(product.minimumOrderQuantity);

    renderReviews(product.reviews || []);
    updateTotal();
  } catch (e) {
    setStatus(`Failed to load product: ${e.message}`);
    console.error(e);
    return;
  }

  const btn = el("addToCartBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      const qty = Math.max(1, Number(el("qtyInput")?.value || 1));

      try {
        setStatus("Adding to cart...");
        const res = await addToCart({
          userId: 1,
          productId: Number(product.id),
          quantity: qty,
        });

        const total = res.total ?? res.cart?.total;
        const discounted = res.discountedTotal ?? res.cart?.discountedTotal;

        alert(`Added to cart successfully!\nTotal: ${total}\nDiscounted Total: ${discounted}`);

        showToast(`✅ Added to cart: ${product?.title ?? "Product"} (x${qty})`);

        setStatus("");

      } catch (e) {
        alert(`Add to cart failed: ${e.message}`);
        setStatus("");
      }
    });
  }
}
