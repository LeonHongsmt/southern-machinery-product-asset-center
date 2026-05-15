import React, { useEffect, useMemo, useState } from "react";

import { ProductList } from "./pages/ProductList.jsx";
import { ProductDetail } from "./pages/ProductDetail.jsx";
import { ProductLandingPage } from "./pages/ProductLandingPage.jsx";
import {
  buildProductHash,
  buildProductSlug,
  formatModelFromSlug
} from "./utils/modelNormalize.js";
import {
  FEATURED_LANDING_PAGES,
  getFeaturedLandingPageBySlug
} from "./utils/productLandingContent.js";

const ASSET_CENTER_HASH = "#/";
const ASSET_CENTER_ALT_HASH = "#/asset-center";
const PRODUCT_ROUTE_PREFIX = "#/products/";
const S3000_LANDING_HASH = "#/products/s-3000";

function assetKey(asset) {
  return `${asset.product_model}::${asset.category}::${asset.file_name}::${asset.source_url}`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

function buildSearchIndex(asset) {
  return [
    asset.product_model,
    asset.product_name,
    asset.file_name,
    asset.category,
    asset.source_url
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function parseHashRoute() {
  if (typeof window === "undefined") {
    return {
      view: "asset-center",
      productSlug: ""
    };
  }

  const hash = decodeURIComponent(String(window.location.hash || "").trim());
  const normalizedHash = hash.toLowerCase();

  if (
    !normalizedHash ||
    normalizedHash === "#" ||
    normalizedHash === ASSET_CENTER_HASH ||
    normalizedHash === ASSET_CENTER_ALT_HASH
  ) {
    return {
      view: "asset-center",
      productSlug: ""
    };
  }

  if (normalizedHash.startsWith(PRODUCT_ROUTE_PREFIX)) {
    const slug = normalizedHash
      .slice(PRODUCT_ROUTE_PREFIX.length)
      .split(/[?#]/)[0]
      .replace(/^\/+|\/+$/g, "");

    return {
      view: slug ? "product-landing" : "asset-center",
      productSlug: slug
    };
  }

  return {
    view: "asset-center",
    productSlug: ""
  };
}

function countLinks(assets, key) {
  return assets.reduce((sum, asset) => {
    const links = Array.isArray(asset[key]) ? asset[key] : [];
    return sum + links.length;
  }, 0);
}

function getVisibilityStatus(asset) {
  const visibility = String(asset?.visibility || "public").trim().toLowerCase();
  return ["public", "internal_review", "hidden"].includes(visibility)
    ? visibility
    : "public";
}

function getPrimaryImage(asset) {
  return Array.isArray(asset.image_links) && asset.image_links.length
    ? asset.image_links[0]
    : "";
}

function buildMailtoLink(asset, type) {
  const model = asset?.product_model || "unknown_model";
  const name = asset?.product_name || "To be confirmed";
  const subjectText =
    type === "quotation"
      ? `Quotation Request for ${model} - ${name}`
      : `Inquiry about ${model} - ${name}`;
  const subject = encodeURIComponent(subjectText);
  const body = encodeURIComponent(
    [
      "Hello Southern Machinery team,",
      "",
      `I would like to discuss this product asset: ${model} - ${name}.`,
      `Category: ${asset?.category || "To be confirmed"}`,
      "",
      "Please share the next step."
    ].join("\n")
  );
  return `mailto:info@smthelp.com?subject=${subject}&body=${body}`;
}

function openMailtoLink(event, mailtoLink) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (typeof window !== "undefined") {
    window.location.href = mailtoLink;
  }
}

function navigateToHash(event, targetHash) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (typeof window !== "undefined") {
    window.location.hash = targetHash;
  }
}

export function App() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("customer-visible");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [route, setRoute] = useState(parseHashRoute);
  const [status, setStatus] = useState({
    loading: true,
    error: ""
  });

  useEffect(() => {
    function syncHashRoute() {
      setRoute(parseHashRoute());
    }

    syncHashRoute();
    window.addEventListener("hashchange", syncHashRoute);

    return () => {
      window.removeEventListener("hashchange", syncHashRoute);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const featuredLandingPage = getFeaturedLandingPageBySlug(route.productSlug);
    document.title =
      route.view === "product-landing"
        ? `${featuredLandingPage?.title || formatModelFromSlug(route.productSlug)} | Southern Machinery`
        : "Southern Machinery Product Asset Center";
  }, [route]);

  useEffect(() => {
    let active = true;

    async function loadAssets() {
      try {
        setStatus({ loading: true, error: "" });
        const response = await fetch("/data/product_assets.json");
        if (!response.ok) {
          throw new Error(`Failed to load data: HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (!active) {
          return;
        }
        const nextAssets = Array.isArray(payload) ? payload : [];
        setAssets(nextAssets);
        setSelectedKey(nextAssets[0] ? assetKey(nextAssets[0]) : "");
        setStatus({ loading: false, error: "" });
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus({
          loading: false,
          error: error.message || "Failed to load product assets."
        });
      }
    }

    loadAssets();

    return () => {
      active = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(search);

    return assets.filter((asset) => {
      const rawIndex = buildSearchIndex(asset);
      const normalizedIndex = normalizeSearchText(rawIndex);
      const matchesRawQuery = query ? rawIndex.includes(query) : true;
      const matchesNormalizedQuery = normalizedQuery
        ? normalizedIndex.includes(normalizedQuery)
        : true;
      const matchesSearch = query || normalizedQuery
        ? matchesRawQuery || matchesNormalizedQuery
        : true;
      const matchesFileType =
        fileTypeFilter === "all" ? true : asset.file_type === fileTypeFilter;
      const needsReview = asset.product_model === "unknown_model";
      const matchesReview =
        reviewFilter === "all"
          ? true
          : reviewFilter === "needs-review"
            ? needsReview
            : !needsReview;
      const visibility = getVisibilityStatus(asset);
      const matchesVisibility =
        visibilityFilter === "customer-visible"
          ? visibility !== "hidden"
          : visibilityFilter === "public-only"
            ? visibility === "public"
            : visibilityFilter === "internal-review"
              ? visibility === "internal_review"
              : visibilityFilter === "hidden"
                ? visibility === "hidden"
                : true;
      const matchesCategory =
        categoryFilter === "all" ? true : asset.category === categoryFilter;

      return (
        matchesSearch &&
        matchesFileType &&
        matchesReview &&
        matchesVisibility &&
        matchesCategory
      );
    });
  }, [assets, search, fileTypeFilter, reviewFilter, visibilityFilter, categoryFilter]);

  const selectedAsset = useMemo(() => {
    return (
      filteredAssets.find((asset) => assetKey(asset) === selectedKey) ||
      filteredAssets[0] ||
      null
    );
  }, [filteredAssets, selectedKey]);

  useEffect(() => {
    if (!filteredAssets.length) {
      return;
    }
    const currentExists = filteredAssets.some(
      (asset) => assetKey(asset) === selectedKey
    );
    if (!currentExists) {
      setSelectedKey(assetKey(filteredAssets[0]));
    }
  }, [filteredAssets, selectedKey]);

  const unknownCount = assets.filter(
    (asset) => asset.product_model === "unknown_model"
  ).length;
  const visibilityCounts = useMemo(() => {
    return assets.reduce(
      (counts, asset) => {
        const visibility = getVisibilityStatus(asset);
        counts[visibility] += 1;
        return counts;
      },
      {
        public: 0,
        internal_review: 0,
        hidden: 0
      }
    );
  }, [assets]);
  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(assets.map((asset) => asset.category).filter(Boolean))
    ).sort();
  }, [assets]);
  const relatedImageByModel = useMemo(() => {
    const map = {};

    for (const asset of assets) {
      const model = String(asset.product_model || "").trim();
      const primaryImage = getPrimaryImage(asset);

      if (
        !model ||
        model === "unknown_model" ||
        !primaryImage ||
        map[model] ||
        getVisibilityStatus(asset) === "hidden"
      ) {
        continue;
      }

      map[model] = primaryImage;
    }

    return map;
  }, [assets]);
  const stats = useMemo(() => {
    return {
      assetsLoaded: assets.length,
      publicAssets: visibilityCounts.public,
      internalReviewAssets: visibilityCounts.internal_review,
      hiddenAssets: visibilityCounts.hidden,
      visibleResults: filteredAssets.length,
      needsManualReview: unknownCount
    };
  }, [assets.length, filteredAssets.length, unknownCount, visibilityCounts]);
  const statCards = [
    ["Total Assets", stats.assetsLoaded],
    ["Public Assets", stats.publicAssets],
    ["Internal Review", stats.internalReviewAssets],
    ["Hidden by Rules", stats.hiddenAssets],
    ["Current View", stats.visibleResults],
    ["Manual Review Required", stats.needsManualReview]
  ];
  const inquiryLink = buildMailtoLink(selectedAsset, "inquiry");
  const quotationLink = buildMailtoLink(selectedAsset, "quotation");
  const featuredLandingPages = useMemo(() => {
    return FEATURED_LANDING_PAGES.map((entry) => {
      const token = buildProductSlug(entry.model);
      const publicAssets = assets.filter((asset) => {
        const visibility = getVisibilityStatus(asset);
        return buildProductSlug(asset.product_model) === token && visibility === "public";
      });

      return {
        ...entry,
        publicAssetCount: publicAssets.length
      };
    });
  }, [assets]);
  const footer = React.createElement(
    "footer",
    { className: "site-footer" },
    React.createElement(
      "div",
      { className: "site-footer-brand" },
      React.createElement("strong", null, "Southern Machinery"),
      React.createElement(
        "p",
        null,
        "Product asset records are generated from public file samples and require final sales review before customer use."
      ),
      React.createElement(
        "p",
        { className: "site-footer-note" },
        "Visibility labels are for internal sales and marketing review. Final customer-facing use should be confirmed by the Southern Machinery team."
      )
    ),
    React.createElement(
      "div",
      { className: "site-footer-links" },
      React.createElement(
        "a",
        {
          href: "https://www.smthelp.com",
          target: "_blank",
          rel: "noreferrer"
        },
        "Website: www.smthelp.com"
      ),
      React.createElement(
        "a",
        {
          href: "mailto:info@smthelp.com"
        },
        "Email: info@smthelp.com"
      )
    )
  );

  if (route.view === "product-landing") {
    return React.createElement(
      "div",
      { className: "app-shell" },
      React.createElement(ProductLandingPage, {
        assets,
        productSlug: route.productSlug,
        loading: status.loading,
        error: status.error,
        onBackToAssetCenter: (event) => navigateToHash(event, ASSET_CENTER_HASH)
      }),
      footer
    );
  }

  return React.createElement(
    "div",
    { className: "app-shell" },
    React.createElement(
      "header",
      { className: "hero-shell" },
      React.createElement(
        "div",
        { className: "hero-copy" },
        React.createElement(
          "p",
          { className: "eyebrow" },
          "Southern Machinery Product Asset Center"
        ),
        React.createElement(
          "h1",
          { className: "hero-title" },
          "SMT & THT Equipment Documents, Images, and Product Assets"
        ),
        React.createElement(
          "p",
          { className: "hero-text" },
          "Review Southern Machinery product assets collected from the public file station. Customer-visible records are shown by default, while hidden records remain available for internal audit."
        ),
        React.createElement(
          "div",
          { className: "hero-actions" },
          React.createElement(
            "button",
            {
              type: "button",
              className: "primary-action",
              onClick: (event) => openMailtoLink(event, quotationLink)
            },
            "Request Quotation"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "secondary-action",
              onClick: (event) => openMailtoLink(event, inquiryLink)
            },
            "Send Inquiry"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "secondary-action",
              onClick: (event) => navigateToHash(event, S3000_LANDING_HASH)
            },
            "View S-3000 Landing Page"
          )
        )
      ),
      React.createElement(
        "div",
        { className: "hero-stats" },
        ...statCards.map(([label, value]) =>
          React.createElement(
            "div",
            { className: "stat-card", key: label },
            React.createElement("span", { className: "stat-value" }, String(value)),
            React.createElement("span", { className: "stat-label" }, label)
          )
        )
      )
    ),
    React.createElement(
      "main",
      { className: "asset-center-main" },
      React.createElement(
        "section",
        { className: "featured-landing-panel" },
        React.createElement("p", { className: "section-label" }, "Featured Landing Pages"),
        React.createElement("h2", { className: "section-title" }, "Customer-facing product page templates"),
        React.createElement(
          "p",
          { className: "section-text" },
          "Use these entry points to preview customer-visible landing pages generated from public Southern Machinery assets."
        ),
        React.createElement(
          "div",
          { className: "featured-landing-grid" },
          ...featuredLandingPages.map((entry) =>
            React.createElement(
              "article",
              {
                className: "featured-landing-card",
                key: entry.slug
              },
              React.createElement("p", { className: "featured-landing-model" }, entry.model),
              React.createElement("h3", { className: "featured-landing-title" }, entry.title),
              React.createElement(
                "p",
                { className: "featured-landing-text" },
                entry.subtitle
              ),
              React.createElement(
                "div",
                { className: "featured-landing-meta" },
                React.createElement("span", null, `${entry.publicAssetCount} public asset${entry.publicAssetCount === 1 ? "" : "s"}`),
                React.createElement("span", null, entry.slug)
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "secondary-action featured-landing-action",
                  onClick: (event) => navigateToHash(event, buildProductHash(entry.model))
                },
                `View ${entry.model} Landing Page`
              )
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "workspace" },
      React.createElement(ProductList, {
        assets: filteredAssets,
        totalAssets: assets.length,
        search,
        onSearchChange: setSearch,
        fileTypeFilter,
        onFileTypeFilterChange: setFileTypeFilter,
        reviewFilter,
        onReviewFilterChange: setReviewFilter,
        visibilityFilter,
        onVisibilityFilterChange: setVisibilityFilter,
        categoryFilter,
        onCategoryFilterChange: setCategoryFilter,
        categoryOptions,
        relatedImageByModel,
        onSelect: (asset) => setSelectedKey(assetKey(asset)),
        onOpenLandingPage: (asset) =>
          navigateToHash(null, buildProductHash(asset?.product_model)),
        selectedKey
      }),
      React.createElement(ProductDetail, {
        asset: selectedAsset,
        relatedImageByModel,
        loading: status.loading,
        error: status.error
      }),
      ),
      footer
    )
  );
}
