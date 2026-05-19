import React from "react";

import { LandingHero } from "../components/LandingHero.jsx";
import { LandingSection } from "../components/LandingSection.jsx";
import {
  formatModelFromSlug,
  normalizeModel
} from "../utils/modelNormalize.js";
import { getProductLandingContent } from "../utils/productLandingContent.js";
import { generateProductMarketingCopy } from "../utils/productMarketingCopy.js";

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

  return formatModelFromSlug(slug);
}

function buildLandingMailtoLink(title, type) {
  const subjectText =
    type === "quotation"
      ? `Quotation Request for ${title}`
      : `Inquiry about ${title}`;
  const subject = encodeURIComponent(subjectText);
  const body = encodeURIComponent(
    [
      "Hello Southern Machinery team,",
      "",
      `I would like to discuss ${title}.`,
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

function renderImageGallery(links, selectedImage, onSelectImage) {
  const h = React.createElement;

  if (!links.length) {
    return h(
      "div",
      { className: "landing-empty-resource-card" },
      h(
        "p",
        { className: "landing-muted" },
        "Product images are not yet available in the public asset set."
      ),
      h(
        "p",
        { className: "landing-resource-support" },
        "Available documents can still be reviewed for product context."
      )
    );
  }

  return h(
    "div",
    { className: "landing-image-gallery" },
    ...links.map((link, index) => {
      const isActive = link === selectedImage;

      return h(
        "article",
        {
          className: `landing-image-card${isActive ? " active" : ""}`,
          key: `landing-image-${link}`
        },
        h(
          "button",
          {
            type: "button",
            className: "landing-image-card-preview",
            onClick: () => onSelectImage(link)
          },
          h("img", {
            src: link,
            alt: `Product image ${index + 1}`
          })
        ),
        h(
          "div",
          { className: "landing-image-card-footer" },
          h("span", { className: "landing-image-card-label" }, `Image ${index + 1}`),
          h(
            "div",
            { className: "landing-image-card-actions" },
            h(
              "button",
              {
                type: "button",
                className: "landing-image-select",
                onClick: () => onSelectImage(link)
              },
              isActive ? "Current Hero Image" : "Set as Hero Image"
            ),
            h(
              "a",
              {
                href: link,
                target: "_blank",
                rel: "noreferrer",
                className: "landing-resource-link landing-image-open-link"
              },
              "Open Image"
            )
          )
        )
      );
    })
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
  const modelToken = normalizeModel(productSlug);
  const unknownModelToken = normalizeModel("unknown_model");
  const allMatchingAssets = Array.isArray(assets)
    ? assets.filter(
        (asset) =>
          modelToken !== unknownModelToken &&
          normalizeModel(asset.product_model) === modelToken &&
          normalizeModel(asset.product_model) !== unknownModelToken
      )
    : [];
  const publicAssets = allMatchingAssets.filter(
    (asset) => String(asset.visibility || "public").trim().toLowerCase() === "public"
  );
  const excludedAssets = allMatchingAssets.filter(
    (asset) => String(asset.visibility || "public").trim().toLowerCase() !== "public"
  );
  const displayAssets = publicAssets;
  const displayModel = formatDisplayModel(productSlug, allMatchingAssets);
  const primaryProductName =
    displayAssets.find((asset) => asset?.product_name)?.product_name ||
    allMatchingAssets.find((asset) => asset?.product_name)?.product_name ||
    "To be confirmed";
  const categories = uniqueStrings(displayAssets.map((asset) => asset.category));
  const previewImage = uniqueStrings(
    displayAssets.flatMap((asset) =>
      Array.isArray(asset.image_links) ? asset.image_links : []
    )
  )[0] || "";
  const pdfLinks = flattenLinks(displayAssets, "pdf_links");
  const imageLinks = flattenLinks(displayAssets, "image_links");
  const documentLinks = flattenLinks(displayAssets, "manual_links");
  const sourceUrls = uniqueStrings(displayAssets.map((asset) => asset.source_url));
  const [selectedImage, setSelectedImage] = React.useState(previewImage);
  React.useEffect(() => {
    setSelectedImage(previewImage);
  }, [previewImage]);
  const activePreviewImage = selectedImage || previewImage;
  const hasPreviewImage = Boolean(activePreviewImage);
  const hasDocuments = pdfLinks.length > 0 || documentLinks.length > 0;
  const landingContent = getProductLandingContent({
    productSlug,
    displayModel,
    productName: primaryProductName
  });
  const displayProductName = landingContent.productName || primaryProductName;
  const marketingCopy = generateProductMarketingCopy(
    {
      productModel: displayModel,
      productName: displayProductName,
      category: categories.join(", "),
      fileName:
        displayAssets.find((asset) => asset?.file_name)?.file_name ||
        allMatchingAssets.find((asset) => asset?.file_name)?.file_name ||
        "",
      title: landingContent.title
    },
    displayAssets
  );
  const assetSummary = [
    { label: "Public assets", value: displayAssets.length },
    { label: "Image links", value: imageLinks.length },
    { label: "Document links", value: documentLinks.length },
    { label: "PDF links", value: pdfLinks.length }
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

  if (!allMatchingAssets.length) {
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
      h(
        "section",
        { className: "landing-loading" },
        h("p", { className: "landing-eyebrow" }, "Product Landing Page"),
        h("h1", null, "Product assets to be confirmed"),
        h(
          "p",
          null,
          `No customer-visible product assets are currently mapped to ${formatModelFromSlug(productSlug)}. Please return to the asset center and review available files.`
        )
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
      title: landingContent.title,
      subtitle: marketingCopy.subtitle,
      introduction: landingContent.introduction,
      previewImage: activePreviewImage,
      previewImages: imageLinks,
      selectedImage: activePreviewImage,
      onSelectPreviewImage: setSelectedImage,
      hasDocuments,
      assetSummary,
      onRequestQuotation: (event) => openMailto(event, landingContent.title, "quotation"),
      onSendInquiry: (event) => openMailto(event, landingContent.title, "inquiry"),
      onViewDocuments: scrollToAssets
    }),
    h(
      "div",
      { className: "landing-content" },
      h(
        LandingSection,
        {
          eyebrow: "Product Overview",
          title: "Product overview from available public assets",
          description: marketingCopy.overview
        },
        h(
          "div",
          { className: "landing-facts-grid" },
          h(
            "div",
            { className: "landing-fact-card" },
            h("span", { className: "landing-fact-label" }, "Product Model"),
            h("strong", null, displayModel)
          ),
          h(
            "div",
            { className: "landing-fact-card" },
            h("span", { className: "landing-fact-label" }, "Product Name"),
            h("strong", null, displayProductName || "To be confirmed from official document")
          ),
          h(
            "div",
            { className: "landing-fact-card" },
            h("span", { className: "landing-fact-label" }, "Category"),
            h("strong", null, categories.length ? categories.join(", ") : "To be confirmed from official document")
          )
        )
      ),
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
          ...marketingCopy.keyBenefits.map((item) =>
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
          ...marketingCopy.applications.map((item) =>
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
            "The current customer-facing view uses only public product records from the asset dataset. Internal review and hidden records are excluded from this landing page."
        },
        h(
          "div",
          { className: "landing-assets-grid" },
          renderResourceColumn("PDF Links", pdfLinks, "Download PDF", "pdf"),
          h(
            "div",
            { className: "landing-resource-column", key: "Image Links" },
            h("h3", null, "Image Links"),
            renderImageGallery(imageLinks, activePreviewImage, setSelectedImage)
          ),
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
          activePreviewImage
            ? h("img", { src: activePreviewImage, alt: `${displayModel} asset preview` })
            : h(
                "div",
                { className: "landing-image-placeholder compact" },
                h("span", { className: "landing-placeholder-kicker" }, "Product Visual"),
                h("strong", null, "Image to be confirmed")
              )
        ),
        !hasPreviewImage
          ? h(
              "p",
              { className: "landing-image-status-note" },
              "Product images are not yet available in the public asset set. Available documents can still be reviewed for product context."
            )
          : null,
        excludedAssets.length
          ? h(
              "p",
              { className: "landing-internal-note" },
              "Additional internal review assets may exist but are excluded from this customer-facing page."
          )
          : null
      ),
      h(
        LandingSection,
        {
          eyebrow: "FAQ",
          title: "Frequently asked questions",
          description:
            "These answers are intentionally conservative and should be confirmed with Southern Machinery before customer-facing use."
        },
        h(
          "div",
          { className: "landing-faq-grid" },
          ...marketingCopy.faq.map((item) =>
            h(
              "article",
              { className: "landing-faq-card", key: item.question },
              h("h3", { className: "landing-faq-question" }, item.question),
              h("p", { className: "landing-faq-answer" }, item.answer)
            )
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
            marketingCopy.ctaNote
          ),
          !hasPreviewImage
            ? h(
                "p",
                { className: "landing-cta-support-note" },
                "Product images and final configuration visuals can be confirmed by the Southern Machinery sales team."
              )
            : null
        ),
        h(
          "div",
          { className: "landing-actions" },
          h(
            "button",
            {
              type: "button",
              className: "primary-action",
              onClick: (event) => openMailto(event, landingContent.title, "quotation")
            },
            "Request Quotation"
          ),
          h(
            "button",
            {
              type: "button",
              className: "secondary-action",
              onClick: (event) => openMailto(event, landingContent.title, "inquiry")
            },
            "Send Inquiry"
          )
        )
      )
    )
  );
}
