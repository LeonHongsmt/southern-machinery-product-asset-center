import React from "react";

import { getFeaturedLandingPageByModel } from "../utils/productLandingContent.js";

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

export function ProductCard({
  asset,
  active,
  onSelect,
  relatedImageUrl,
  onOpenLandingPage
}) {
  const h = React.createElement;
  const primaryImage = getPrimaryImage(asset);
  const needsManualReview = asset.product_model === "unknown_model";
  const visibility = String(asset.visibility || "public").trim().toLowerCase();
  const featuredLandingPage = getFeaturedLandingPageByModel(asset.product_model);
  const supportsLandingPage = Boolean(featuredLandingPage);
  const canUseRelatedImage =
    !primaryImage &&
    asset.file_type !== "image" &&
    asset.product_model !== "unknown_model" &&
    relatedImageUrl;
  const previewImage = primaryImage || (canUseRelatedImage ? relatedImageUrl : "");
  const placeholderLabel = getAssetPlaceholder(asset);

  function handleCardSelect() {
    onSelect(asset);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardSelect();
    }
  }

  function handleOpenLandingPage(event) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof onOpenLandingPage === "function") {
      onOpenLandingPage(asset);
    }
  }

  return h(
    "div",
    {
      className: `product-card${active ? " active" : ""}`,
      role: "button",
      tabIndex: 0,
      onClick: handleCardSelect,
      onKeyDown: handleCardKeyDown
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
        h(
          "div",
          { className: "product-card-flags" },
          visibility === "public"
            ? h(
                "span",
                { className: "visibility-flag visibility-flag-public" },
                "Public"
              )
            : null,
          visibility === "internal_review"
            ? h(
                "span",
                { className: "visibility-flag visibility-flag-review" },
                "Internal Review"
              )
            : null,
          visibility === "hidden"
            ? h(
                "span",
                { className: "visibility-flag visibility-flag-hidden" },
                "Hidden from Customer View"
              )
            : null,
          needsManualReview
            ? h(
                "span",
                { className: "review-flag" },
                "Needs Manual Review"
              )
            : null
        )
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
      visibility === "internal_review"
        ? h(
            "p",
            { className: "visibility-note visibility-note-review" },
            "This asset requires internal review before customer-facing publication."
          )
        : null,
      visibility === "hidden"
        ? h(
            "p",
            { className: "visibility-note visibility-note-hidden" },
            "This asset is hidden by visibility rules and should not be published to customers without review."
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
        visibility === "hidden"
          ? "Hidden asset shown only because the current visibility filter includes hidden records."
          : needsManualReview
          ? "Record requires manual confirmation before customer-facing publication."
          : visibility === "internal_review"
            ? "Asset is available for internal review before customer-facing publication."
            : "Sample asset is available for detail review."
      ),
      supportsLandingPage
        ? h(
            "div",
            { className: "product-card-actions" },
            h(
              "button",
              {
                type: "button",
                className: "product-card-action-link",
                onClick: handleOpenLandingPage
              },
            "View Landing Page"
          )
        )
        : null
    )
  );
}
