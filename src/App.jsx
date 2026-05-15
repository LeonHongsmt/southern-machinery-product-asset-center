import React, { useEffect, useMemo, useState } from "react";

import { ProductList } from "./pages/ProductList.jsx";
import { ProductDetail } from "./pages/ProductDetail.jsx";

function assetKey(asset) {
  return `${asset.product_model}::${asset.category}::${asset.file_name}::${asset.source_url}`;
}

function buildSearchIndex(asset) {
  return [
    asset.product_model,
    asset.product_name,
    asset.file_name,
    asset.category
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

export function App() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("customer-visible");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [status, setStatus] = useState({
    loading: true,
    error: ""
  });

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
    return assets.filter((asset) => {
      const matchesSearch = query
        ? buildSearchIndex(asset).includes(query)
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
        selectedKey
      }),
      React.createElement(ProductDetail, {
        asset: selectedAsset,
        relatedImageByModel,
        loading: status.loading,
        error: status.error
      }),
      React.createElement(
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
      )
    )
  );
}
