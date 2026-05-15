import React from "react";

export function LandingHero({
  model,
  title,
  subtitle,
  introduction,
  previewImage,
  assetSummary,
  onRequestQuotation,
  onSendInquiry,
  onViewDocuments
}) {
  const h = React.createElement;

  return h(
    "section",
    { className: "landing-hero" },
    h(
      "div",
      { className: "landing-hero-copy" },
      h("p", { className: "landing-eyebrow" }, "Southern Machinery Customer Landing Page"),
      h(
        "div",
        { className: "landing-model-row" },
        h("span", { className: "landing-model-label" }, "Product Model"),
        h("strong", { className: "landing-model-value" }, model)
      ),
      h("h1", { className: "landing-hero-title" }, title),
      h("p", { className: "landing-hero-subtitle" }, subtitle),
      h("p", { className: "landing-hero-introduction" }, introduction),
      h(
        "div",
        { className: "landing-actions" },
        h(
          "button",
          {
            type: "button",
            className: "primary-action",
            onClick: onRequestQuotation
          },
          "Request Quotation"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-action",
            onClick: onSendInquiry
          },
          "Send Inquiry"
        ),
        h(
          "button",
          {
            type: "button",
            className: "secondary-action",
            onClick: onViewDocuments
          },
          "View Documents"
        )
      )
    ),
    h(
      "div",
      { className: "landing-hero-preview" },
      previewImage
        ? h("img", {
            src: previewImage,
            alt: `${title} preview`
          })
        : h(
            "div",
            { className: "landing-image-placeholder" },
            h("span", { className: "landing-placeholder-kicker" }, "Product Visual"),
            h("strong", null, "Image to be confirmed")
          ),
      h(
        "div",
        { className: "landing-summary-panel" },
        h("p", { className: "landing-summary-label" }, "Public Asset Snapshot"),
        h(
          "div",
          { className: "landing-summary-grid" },
          ...assetSummary.map((item) =>
            h(
              "div",
              { className: "landing-summary-item", key: item.label },
              h("strong", null, String(item.value)),
              h("span", null, item.label)
            )
          )
        )
      )
    )
  );
}
