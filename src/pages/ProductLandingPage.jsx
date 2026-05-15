import React from "react";

import { LandingHero } from "../components/LandingHero.jsx";
import { LandingSection } from "../components/LandingSection.jsx";

function normalizeModelValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values.filter((value) => typeof value === "string" && value.trim().length > 0)
    )
  );
}

function flattenLinks(assets, key) {
  return uniqueStrings(
    assets.flatMap((asset) => (Array.isArray(asset[key]) ? asset[key] : []))
  );
}

function formatDisplayModel(slug, assets) {
  const assetModel = assets.find((asset) => asset?.product_model)?.product_model;
  if (assetModel) {
    return assetModel;
  }

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

function buildLandingMailtoLink(model, type) {
  const subjectText =
    type === "quotation"
      ? `Quotation Request for ${model} Radial Insertion Machine`
      : `Inquiry about ${model} Radial Insertion Machine`;
  const subject = encodeURIComponent(subjectText);
  const body = encodeURIComponent(
    [
      "Hello Southern Machinery team,",
      "",
      `I would like to discuss the ${model} Radial Insertion Machine.`,
      "",
      "Please share the next step."
    ].join("\n")
  );

  return `mailto:info@smthelp.com?subject=${subject}&body=${body}`;
}

function openMailto(event, model, type) {
  event.preventDefault();
  event.stopPropagation();

  if (typeof window !== "undefined") {
    window.location.href = buildLandingMailtoLink(model, type);
  }
}

function openExternalLink(event, url) {
  event.preventDefault();
  event.stopPropagation();

  if (typeof window !== "undefined" && url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function scrollToAssets(event) {
  event.preventDefault();
  event.stopPropagation();

  if (typeof document !== "undefined") {
    const section = document.getElementById("landing-assets");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderResourceColumn(title, links, label, type) {
  const h = React.createElement;

  return h(
    "div",
    { className: "landing-resource-column", key: title },
    h("h3", null, title),
    links.length
      ? h(
          "div",
          { className: "landing-resource-list" },
          ...links.map((link) =>
            h(
              type === "source" ? "button" : "a",
              type === "source"
                ? {
                    key: `${title}-${link}`,
                    type: "button",
                    className: "landing-resource-link",
                    onClick: (event) => openExternalLink(event, link)
                  }
                : {
                    key: `${title}-${link}`,
                    href: link,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "landing-resource-link"
                  },
              h("span", { className: "landing-resource-label" }, label),
              h("span", { className: "landing-resource-url" }, link)
            )
          )
        )
      : h("p", { className: "landing-muted" }, "To be confirmed")
  );
}

export function ProductLandingPage({
  assets,
  productSlug,
  loading,
  error,
  onBackToAssetCenter
}) {
  const h = React.createElement;
  const modelToken = normalizeModelValue(productSlug);
  const allMatchingAssets = Array.isArray(assets)
    ? assets.filter((asset) => normalizeModelValue(asset.product_model) === modelToken)
    : [];
  const customerVisibleAssets = allMatchingAssets.filter(
    (asset) => asset.visibility !== "hidden"
  );
  const displayAssets = customerVisibleAssets.length
    ? customerVisibleAssets
    : allMatchingAssets;
  const displayModel = formatDisplayModel(productSlug, displayAssets);
  const landingTitle =
    modelToken === "s3000"
      ? "S-3000 Radial Insertion Machine"
      : `${displayModel} Product Landing Page`;
  const landingSubtitle =
    modelToken === "s3000"
      ? "Automated THT radial component insertion solution for EMS and PCB assembly production."
      : "Product information generated from available Southern Machinery public file assets.";
  const overviewText =
    modelToken === "s3000"
      ? "The S-3000 is presented in the available product assets as a radial insertion solution for THT PCB assembly and EMS production environments. Specific speed, accuracy, dimension, and configuration details are to be confirmed from official document."
      : `${displayModel} product information is available through the current asset dataset. Detailed commercial and technical specifications are to be confirmed from official document.`;
  const previewImage = uniqueStrings(
    displayAssets.flatMap((asset) =>
      Array.isArray(asset.image_links) ? asset.image_links : []
    )
  )[0] || "";
  const pdfLinks = flattenLinks(displayAssets, "pdf_links");
  const documentLinks = flattenLinks(displayAssets, "manual_links");
  const sourceUrls = uniqueStrings(displayAssets.map((asset) => asset.source_url));
  const assetSummary = [
    { label: "Visible assets", value: displayAssets.length },
    { label: "Document links", value: documentLinks.length },
    { label: "PDF links", value: pdfLinks.length }
  ];
  const benefitItems = [
    "Supports automated radial component insertion",
    "Helps improve THT assembly consistency",
    "Suitable for EMS production workflows",
    "Reduces repetitive manual insertion work",
    "Can be reviewed with available product documents"
  ];
  const applicationItems = [
    "EMS factories",
    "THT PCB assembly",
    "Smart electronics production",
    "Automotive electronics control boards",
    "Industrial electronics PCB assembly"
  ];

  if (loading) {
    return h(
      "main",
      { className: "landing-page" },
      h(
        "section",
        { className: "landing-loading" },
        h("p", { className: "landing-eyebrow" }, "Loading"),
        h("h1", null, `Preparing the ${displayModel} landing page`),
        h("p", null, "Please wait while product assets are loaded.")
      )
    );
  }

  if (error) {
    return h(
      "main",
      { className: "landing-page" },
      h(
        "section",
        { className: "landing-loading" },
        h("p", { className: "landing-eyebrow" }, "Unavailable"),
        h("h1", null, `Unable to load ${displayModel} assets`),
        h("p", null, error)
      )
    );
  }

  return h(
    "main",
    { className: "landing-page" },
    h(
      "div",
      { className: "landing-topbar" },
      h(
        "button",
        {
          type: "button",
          className: "landing-backlink",
          onClick: onBackToAssetCenter
        },
        "Back to Asset Center"
      )
    ),
    h(LandingHero, {
      model: displayModel,
      title: landingTitle,
      subtitle: landingSubtitle,
      introduction:
        "This landing page is generated from currently available public Southern Machinery file assets. Positioning and document access can be reviewed here while final commercial details remain to be confirmed from official document.",
      previewImage,
      assetSummary,
      onRequestQuotation: (event) => openMailto(event, displayModel, "quotation"),
      onSendInquiry: (event) => openMailto(event, displayModel, "inquiry"),
      onViewDocuments: scrollToAssets
    }),
    h(
      "div",
      { className: "landing-content" },
      h(LandingSection, {
        eyebrow: "Product Overview",
        title:
          modelToken === "s3000"
            ? "Radial insertion support for THT assembly workflows"
            : "Product overview from available public assets",
        description: overviewText
      }),
      h(
        LandingSection,
        {
          eyebrow: "Key Benefits",
          title: "Practical reasons to review this product",
          description:
            "The current asset set supports a conservative, document-backed positioning without introducing unconfirmed technical claims."
        },
        h(
          "div",
          { className: "landing-list-grid" },
          ...benefitItems.map((item) =>
            h(
              "div",
              { className: "landing-list-card", key: item },
              h("strong", null, item)
            )
          )
        )
      ),
      h(
        LandingSection,
        {
          eyebrow: "Applications",
          title: "Where this solution may fit",
          description:
            "These application areas reflect the broader THT and electronics assembly context indicated by the current public product materials."
        },
        h(
          "div",
          { className: "landing-list-grid" },
          ...applicationItems.map((item) =>
            h(
              "div",
              { className: "landing-list-card", key: item },
              h("strong", null, item)
            )
          )
        )
      ),
      h(
        LandingSection,
        {
          id: "landing-assets",
          eyebrow: "Available Assets",
          title: `Public file assets currently linked to ${displayModel}`,
          description:
            "The current customer-facing view uses customer-visible product records from the asset dataset. Hidden records are excluded from this landing page."
        },
        h(
          "div",
          { className: "landing-assets-grid" },
          renderResourceColumn("PDF Links", pdfLinks, "Download PDF", "pdf"),
          renderResourceColumn(
            "Manual / Document Links",
            documentLinks,
            "Download Document",
            "document"
          ),
          renderResourceColumn("Source URL", sourceUrls, "Open Source URL", "source")
        ),
        h(
          "div",
          { className: "landing-asset-visual" },
          previewImage
            ? h("img", { src: previewImage, alt: `${displayModel} asset preview` })
            : h(
                "div",
                { className: "landing-image-placeholder compact" },
                h("span", { className: "landing-placeholder-kicker" }, "Product Visual"),
                h("strong", null, "Image to be confirmed")
              )
        )
      ),
      h(
        LandingSection,
        {
          eyebrow: "Review Notice",
          title: "Internal confirmation still applies",
          description:
            "Product information is generated from available public file assets and requires final confirmation by Southern Machinery sales team before customer-facing use."
        }
      ),
      h(
        "section",
        { className: "landing-cta-band" },
        h(
          "div",
          { className: "landing-cta-copy" },
          h("p", { className: "landing-section-eyebrow" }, "Next Step"),
          h("h2", null, "Request the latest commercial confirmation"),
          h(
            "p",
            null,
            `Use the contact actions below to request quotation guidance or ask for the latest official document set for ${displayModel}.`
          )
        ),
        h(
          "div",
          { className: "landing-actions" },
          h(
            "button",
            {
              type: "button",
              className: "primary-action",
              onClick: (event) => openMailto(event, displayModel, "quotation")
            },
            "Request Quotation"
          ),
          h(
            "button",
            {
              type: "button",
              className: "secondary-action",
              onClick: (event) => openMailto(event, displayModel, "inquiry")
            },
            "Send Inquiry"
          )
        )
      )
    )
  );
}
