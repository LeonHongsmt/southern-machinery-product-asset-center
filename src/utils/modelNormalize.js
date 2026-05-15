export function normalizeModel(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

export function buildProductSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProductHash(value) {
  const slug = buildProductSlug(value);
  return slug ? `#/products/${slug}` : "#/";
}

export function formatModelFromSlug(slug) {
  const cleaned = String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!cleaned) {
    return "Product";
  }

  return cleaned
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.toUpperCase())
    .join("-");
}
