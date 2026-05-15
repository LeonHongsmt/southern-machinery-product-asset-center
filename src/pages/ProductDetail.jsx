import React from "react";

function linkList(title, links, ctaLabel) {
  const h = React.createElement;
  const normalized = Array.isArray(links) ? links.filter(Boolean) : [];

  return h(
    "section",
    { className: "detail-section" },
    h(
      "div",
      { className: "detail-section-head" },
      h("h3", null, title),
      h("span", null, `${normalized.length} item${normalized.length === 1 ? "" : "s"}`)
    ),
    normalized.length
      ? h(
          "div",
          { className: "link-stack" },
          ...normalized.map((link) =>
            h(
              "a",
              {
                key: `${title}-${link}`,
                href: link,
                target: "_blank",
                rel: "noreferrer",
                className: "resource-link"
              },
              h("span", { className: "resource-link-label" }, ctaLabel),
              h("span", { className: "resource-link-url" }, link)
            )
          )
        )
      : h(
          "p",
          { className: "detail-muted" },
          "To be confirmed"
        )
  );
}

function getPrimaryImage(asset) {
  return Array.isArray(asset.image_links) && asset.image_links.length
    ? asset.image_links[0]
    : "";
}

function getPreviewPlaceholder(asset) {
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

export function ProductDetail({ asset, relatedImageByModel, loading, error }) {
  const h = React.createElement;

  if (loading) {
    return h(
      "aside",
      { className: "detail-panel loading-panel", id: "details" },
      h("p", { className: "section-label" }, "Detail View"),
      h("h2", { className: "section-title" }, "Loading product assets"),
      h(
        "p",
        { className: "detail-muted" },
        "Please wait while the current asset library is loaded."
      )
    );
  }

  if (error) {
    return h(
      "aside",
      { className: "detail-panel loading-panel", id: "details" },
      h("p", { className: "section-label" }, "Detail View"),
      h("h2", { className: "section-title" }, "Unable to load assets"),
      h("p", { className: "detail-error" }, error)
    );
  }

  if (!asset) {
    return h(
      "aside",
      { className: "detail-panel loading-panel", id: "details" },
      h("p", { className: "section-label" }, "Detail View"),
      h("h2", { className: "section-title" }, "No product selected"),
      h(
        "p",
        { className: "detail-muted" },
        "Choose a product card from the list to inspect manuals, PDF assets, images, and source links."
      )
    );
  }

  const primaryImage = getPrimaryImage(asset);
  const needsReview = asset.product_model === "unknown_model";
  const relatedImage =
    !primaryImage &&
    asset.file_type !== "image" &&
    asset.product_model !== "unknown_model"
      ? relatedImageByModel[asset.product_model] || ""
      : "";
  const previewImage = primaryImage || relatedImage;
  const placeholderLabel = getPreviewPlaceholder(asset);

  return h(
    "aside",
    { className: "detail-panel", id: "details" },
    h(
      "div",
      { className: "detail-header" },
      h("p", { className: "section-label" }, "Asset Detail"),
      h(
        "div",
        { className: "detail-badges" },
        h("span", { className: "detail-badge muted" }, asset.category || "uncategorized"),
        needsReview
          ? h("span", { className: "detail-badge warning" }, "Needs Manual Review")
          : h("span", { className: "detail-badge" }, asset.file_type || "other")
      ),
      h(
        "h2",
        { className: "detail-title" },
        asset.product_name || "To be confirmed"
      ),
      h("p", { className: "detail-model" }, asset.product_model || "unknown_model"),
      needsReview
        ? h(
            "div",
            { className: "review-banner" },
            "Needs Manual Review: product model was not detected from filename or path."
          )
        : null,
      h(
        "p",
        { className: "detail-summary" },
        asset.description || "To be confirmed from official document"
      ),
      h(
        "div",
        { className: "detail-actions" },
        h(
          "a",
          {
            className: "primary-action",
            href: asset.source_url,
            target: "_blank",
            rel: "noreferrer"
          },
          "Send Inquiry"
        ),
        h(
          "a",
          {
            className: "secondary-action",
            href: asset.source_url,
            target: "_blank",
            rel: "noreferrer"
          },
          "Request Quotation"
        )
      )
    ),
    h(
      "div",
      { className: "detail-preview" },
      previewImage
        ? h("img", {
            src: previewImage,
            alt: asset.product_name || asset.product_model || "Product asset preview"
          })
        : h(
            "div",
            {
              className: `media-placeholder detail-placeholder media-placeholder-${asset.file_type || "other"}`
            },
            h("span", { className: "placeholder-kicker" }, asset.file_type || "other"),
            h("strong", null, placeholderLabel)
          )
    ),
    relatedImage
      ? h(
          "p",
          { className: "related-image-note detail-related-note" },
          "Related image from same product model"
        )
      : null,
    h(
      "section",
      { className: "detail-section" },
      h("h3", null, "Current record"),
      h(
        "dl",
        { className: "detail-grid" },
        h("div", null, h("dt", null, "Product Model"), h("dd", null, asset.product_model || "To be confirmed")),
        h("div", null, h("dt", null, "Product Name"), h("dd", null, asset.product_name || "To be confirmed")),
        h("div", null, h("dt", null, "Category"), h("dd", null, asset.category || "To be confirmed")),
        h("div", null, h("dt", null, "File Type"), h("dd", null, asset.file_type || "other")),
        h("div", null, h("dt", null, "File Name"), h("dd", null, asset.file_name || "To be confirmed")),
        h("div", null, h("dt", null, "Description"), h("dd", null, asset.description || "To be confirmed from official document")),
        h("div", null, h("dt", null, "Remarks"), h("dd", null, asset.remarks || "To be confirmed from official document"))
      )
    ),
    linkList("PDF Links", asset.pdf_links, "Download PDF"),
    linkList("Image Links", asset.image_links, "Open Image"),
    linkList("Manual / Document Links", asset.manual_links, "Download Document"),
    h(
      "section",
      { className: "detail-section" },
      h("div", { className: "detail-section-head" }, h("h3", null, "Source URL")),
      h(
        "a",
        {
          href: asset.source_url,
          target: "_blank",
          rel: "noreferrer",
          className: "resource-link"
        },
        h("span", { className: "resource-link-label" }, "Open Source URL"),
        h("span", { className: "resource-link-url" }, asset.source_url)
      )
    )
  );
}
