import React, { useMemo } from "react";

import {
  buildProductHash,
  normalizeModel
} from "../utils/modelNormalize.js";
import { FEATURED_LANDING_PAGES } from "../utils/productLandingContent.js";

function flattenUniqueLinks(assets, key) {
  return Array.from(
    new Set(
      assets.flatMap((asset) => (Array.isArray(asset?.[key]) ? asset[key] : []))
    )
  );
}

function buildLandingIndexEntries(assets) {
  const safeAssets = Array.isArray(assets) ? assets : [];

  return FEATURED_LANDING_PAGES.map((entry) => {
    const modelToken = normalizeModel(entry.model);
    const matchedAssets = safeAssets.filter(
      (asset) => normalizeModel(asset?.product_model) === modelToken
    );
    const publicAssets = matchedAssets.filter(
      (asset) => String(asset?.visibility || "public").trim().toLowerCase() === "public"
    );
    const internalReviewAssets = matchedAssets.filter(
      (asset) =>
        String(asset?.visibility || "public").trim().toLowerCase() === "internal_review"
    );
    const hiddenAssets = matchedAssets.filter(
      (asset) => String(asset?.visibility || "public").trim().toLowerCase() === "hidden"
    );

    return {
      ...entry,
      publicAssetCount: publicAssets.length,
      pdfCount: flattenUniqueLinks(publicAssets, "pdf_links").length,
      imageCount: flattenUniqueLinks(publicAssets, "image_links").length,
      documentCount: flattenUniqueLinks(publicAssets, "manual_links").length,
      previewImage: flattenUniqueLinks(publicAssets, "image_links")[0] || "",
      hasPublicImages: flattenUniqueLinks(publicAssets, "image_links").length > 0,
      internalReviewCount: internalReviewAssets.length,
      hiddenCount: hiddenAssets.length
    };
  });
}

export function ProductLandingIndex({
  assets,
  loading,
  error,
  onBackToAssetCenter,
  onReloadAssets,
  onOpenLandingPage
}) {
  const h = React.createElement;
  const entries = useMemo(() => buildLandingIndexEntries(assets), [assets]);

  if (loading) {
    return h(
      "main",
      { className: "landing-index-page" },
      h(
        "section",
        { className: "landing-loading" },
        h("p", { className: "landing-eyebrow" }, "Loading"),
        h("h1", null, "Preparing product landing page index"),
        h(
          "p",
          null,
          "Please wait while the current customer-facing asset list is loaded."
        )
      )
    );
  }

  if (error) {
    return h(
      "main",
      { className: "landing-index-page" },
      h(
        "div",
        { className: "landing-index-topbar" },
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
      h(
        "section",
        { className: "landing-loading" },
        h("p", { className: "landing-eyebrow" }, "Unavailable"),
        h("h1", null, "Unable to load product landing pages"),
        h("p", null, error)
      )
    );
  }

  return h(
    "main",
    { className: "landing-index-page" },
    h(
      "div",
      { className: "landing-index-topbar" },
      h(
        "button",
        {
          type: "button",
          className: "landing-backlink",
          onClick: onBackToAssetCenter
        },
        "Back to Asset Center"
      ),
      h(
        "button",
        {
          type: "button",
          className: "secondary-action landing-index-refresh",
          onClick: onReloadAssets
        },
        "Reload Data"
      )
    ),
    h(
      "section",
      { className: "landing-index-hero" },
      h("p", { className: "landing-eyebrow" }, "Product Landing Page Index"),
      h(
        "h1",
        { className: "landing-index-title" },
        "Southern Machinery Product Landing Pages"
      ),
      h(
        "p",
        { className: "landing-index-subtitle" },
        "Customer-facing product pages generated from available Southern Machinery public product assets."
      )
    ),
    h(
      "section",
      { className: "landing-index-grid" },
      ...entries.map((entry) =>
        h(
          "article",
          {
            className: "landing-index-card",
            key: entry.slug
          },
          entry.hasPublicImages
            ? h(
                "div",
                { className: "landing-index-visual landing-index-visual-ready" },
                entry.previewImage
                  ? h("img", {
                      src: entry.previewImage,
                      alt: `${entry.title} preview`
                    })
                  : null,
                h("span", { className: "landing-index-visual-kicker" }, "Product visual"),
                h("strong", null, "Public image available")
              )
            : h(
                "div",
                { className: "landing-index-visual landing-index-visual-pending" },
                h("div", { className: "landing-index-visual-frame" }),
                h("span", { className: "landing-index-visual-kicker" }, "Visual pending"),
                h("strong", null, "Documents available")
              ),
          h("p", { className: "landing-index-model" }, entry.model),
          h("h2", { className: "landing-index-card-title" }, entry.title),
          h("p", { className: "landing-index-category" }, entry.categoryLabel),
          h("p", { className: "landing-index-text" }, entry.subtitle),
          h(
            "div",
            { className: "landing-index-stats" },
            h(
              "div",
              { className: "landing-index-stat" },
              h("strong", null, String(entry.publicAssetCount)),
              h("span", null, "Public assets")
            ),
            h(
              "div",
              { className: "landing-index-stat" },
              h("strong", null, String(entry.pdfCount)),
              h("span", null, "PDF links")
            ),
            h(
              "div",
              { className: "landing-index-stat" },
              h("strong", null, String(entry.imageCount)),
              h("span", null, "Image links")
            ),
            h(
              "div",
              { className: "landing-index-stat" },
              h("strong", null, String(entry.documentCount)),
              h("span", null, "Document links")
            )
          ),
          entry.publicAssetCount
            ? null
            : h(
                "p",
                { className: "landing-index-note warning" },
                "Assets to be confirmed"
              ),
          entry.internalReviewCount || entry.hiddenCount
            ? h(
                "p",
                { className: "landing-index-note" },
                `${entry.internalReviewCount} internal review asset${
                  entry.internalReviewCount === 1 ? "" : "s"
                } excluded${
                  entry.hiddenCount
                    ? `, ${entry.hiddenCount} hidden asset${
                        entry.hiddenCount === 1 ? "" : "s"
                      } also excluded`
                    : ""
                }.`
              )
            : h(
                "p",
                { className: "landing-index-note" },
                "Customer-facing counts are based on public assets only."
              ),
          h(
            "button",
            {
              type: "button",
              className: "primary-action landing-index-action",
              onClick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (typeof onOpenLandingPage === "function") {
                  onOpenLandingPage(entry.model);
                } else if (typeof window !== "undefined") {
                  window.location.hash = buildProductHash(entry.model);
                }
              }
            },
            "View Landing Page"
          )
        )
      )
    )
  );
}
