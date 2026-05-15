import React from "react";

import { ProductCard } from "../components/ProductCard.jsx";

function assetKey(asset) {
  return `${asset.product_model}::${asset.category}::${asset.file_name}::${asset.source_url}`;
}

export function ProductList({
  assets,
  totalAssets,
  search,
  onSearchChange,
  fileTypeFilter,
  onFileTypeFilterChange,
  reviewFilter,
  onReviewFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  relatedImageByModel,
  onSelect,
  selectedKey
}) {
  const h = React.createElement;
  const fileTypeOptions = ["all", "pdf", "image", "manual", "document", "other"];
  const reviewOptions = [
    ["all", "All records"],
    ["needs-review", "Needs review"],
    ["confirmed-model", "Confirmed model"]
  ];

  return h(
    "section",
    { className: "list-panel" },
    h(
      "div",
      { className: "list-panel-header" },
      h("p", { className: "section-label" }, "Asset Library"),
      h("h2", { className: "section-title" }, "Product asset list"),
      h(
        "p",
        { className: "section-text" },
        `Search across ${totalAssets} current records by model, product name, file name, or category.`
      )
    ),
    h(
      "div",
      { className: "search-box" },
      h("label", { className: "search-label", htmlFor: "product-search" }, "Search assets"),
      h("input", {
        id: "product-search",
        type: "search",
        value: search,
        placeholder: "Search by model, product name, file name, or category",
        onInput: (event) => onSearchChange(event.target.value)
      })
    ),
    h(
      "div",
      { className: "filter-grid" },
      h(
        "div",
        { className: "filter-box" },
        h("label", { className: "search-label", htmlFor: "file-type-filter" }, "File type"),
        h(
          "select",
          {
            id: "file-type-filter",
            value: fileTypeFilter,
            onChange: (event) => onFileTypeFilterChange(event.target.value)
          },
          ...fileTypeOptions.map((option) =>
            h(
              "option",
              { key: option, value: option },
              option === "all" ? "All file types" : option
            )
          )
        )
      ),
      h(
        "div",
        { className: "filter-box" },
        h("label", { className: "search-label", htmlFor: "review-filter" }, "Manual review"),
        h(
          "select",
          {
            id: "review-filter",
            value: reviewFilter,
            onChange: (event) => onReviewFilterChange(event.target.value)
          },
          ...reviewOptions.map(([value, label]) =>
            h("option", { key: value, value }, label)
          )
        )
      ),
      h(
        "div",
        { className: "filter-box" },
        h("label", { className: "search-label", htmlFor: "category-filter" }, "Category"),
        h(
          "select",
          {
            id: "category-filter",
            value: categoryFilter,
            onChange: (event) => onCategoryFilterChange(event.target.value)
          },
          h("option", { value: "all" }, "All categories"),
          ...categoryOptions.map((category) =>
            h("option", { key: category, value: category }, category)
          )
        )
      )
    ),
    h(
      "div",
      { className: "results-line" },
      h("span", null, `${assets.length} result${assets.length === 1 ? "" : "s"}`),
      h("span", null, "Click a card to inspect details")
    ),
    assets.length
      ? h(
          "div",
          { className: "card-grid" },
          ...assets.map((asset) =>
            h(ProductCard, {
              key: assetKey(asset),
              asset,
              active: assetKey(asset) === selectedKey,
              relatedImageUrl: relatedImageByModel[asset.product_model] || "",
              onSelect
            })
          )
        )
      : h(
          "div",
          { className: "empty-state" },
          h("h3", null, "No assets match this search"),
          h(
            "p",
            null,
            "Try a broader keyword or clear the current filter."
          )
        )
  );
}
