import React from "react";

function getPrimaryImage(asset) {
  return Array.isArray(asset.image_links) && asset.image_links.length
    ? asset.image_links[0]
    : "";
}

function getAssetPlaceholder(asset) {
  if (asset.file_type === "pdf") {
    return "PDF Document";
  }
  if (asset.file_type === "manual") {
    return "Manual Document";
  }
  if (asset.file_type === "document") {
    return "Document File";
  }
  if (asset.file_type === "other") {
    return "Asset File";
  }
  return "Image to be confirmed";
}

export function ProductCard({ asset, active, onSelect, relatedImageUrl }) {
  const h = React.createElement;
  const primaryImage = getPrimaryImage(asset);
  const needsManualReview = asset.product_model === "unknown_model";
  const canUseRelatedImage =
    !primaryImage &&
    asset.file_type !== "image" &&
    asset.product_model !== "unknown_model" &&
    relatedImageUrl;
  const previewImage = primaryImage || (canUseRelatedImage ? relatedImageUrl : "");
  const placeholderLabel = getAssetPlaceholder(asset);

  return h(
    "button",
    {
      type: "button",
      className: `product-card${active ? " active" : ""}`,
      onClick: () => onSelect(asset)
    },
    h(
      "div",
      { className: "product-card-media" },
      previewImage
        ? h("img", {
            src: previewImage,
            alt: asset.product_name || asset.product_model || "Product asset preview"
          })
        : h(
            "div",
            {
              className: `media-placeholder media-placeholder-${asset.file_type || "other"}`
            },
            h("span", { className: "placeholder-kicker" }, asset.file_type || "other"),
            h("strong", null, placeholderLabel)
          )
    ),
    h(
      "div",
      { className: "product-card-body" },
      h(
        "div",
        { className: "product-card-topline" },
        h("span", { className: "product-card-model" }, asset.product_model),
        needsManualReview
          ? h(
              "span",
              { className: "review-flag" },
              "Needs Manual Review"
            )
          : null
      ),
      h(
        "h3",
        { className: "product-card-title" },
        asset.product_name || "To be confirmed"
      ),
      h(
        "div",
        { className: "product-card-meta" },
        h("span", { className: "meta-chip" }, asset.category || "uncategorized"),
        h("span", { className: "meta-chip" }, asset.file_type || "other")
      ),
      canUseRelatedImage
        ? h(
            "p",
            { className: "related-image-note" },
            "Related image from same product model"
          )
        : null,
      needsManualReview
        ? h(
            "p",
            { className: "review-note" },
            "Internal review required before customer use"
          )
        : null,
      h(
        "div",
        { className: "product-card-asset-row" },
        h(
          "span",
          { className: "asset-row-label" },
          "File Name"
        ),
        h(
          "span",
          { className: "asset-row-value" },
          asset.file_name || "To be confirmed from official document"
        )
      ),
      h(
        "p",
        { className: "product-card-file" },
        needsManualReview
          ? "Record requires manual confirmation before customer-facing publication."
          : "Sample asset is available for detail review."
      )
    )
  );
}
