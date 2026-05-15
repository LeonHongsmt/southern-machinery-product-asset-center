import { normalizeModel } from "./modelNormalize.js";

const BASE_BENEFITS = [
  "Can be reviewed with available product documents",
  "Supports clearer internal-to-customer handoff for equipment positioning",
  "Helps organize current Southern Machinery public asset references",
  "Suitable for document-led product review before final sales confirmation"
];

const BASE_APPLICATIONS = [
  "EMS factories",
  "PCB assembly workflows",
  "Electronics manufacturing support",
  "Industrial production review and equipment planning"
];

export const FEATURED_LANDING_PAGES = [
  {
    slug: "s-3000",
    model: "S-3000",
    categoryLabel: "THT Radial Insertion",
    title: "S-3000 Radial Insertion Machine",
    subtitle:
      "Automated THT radial component insertion solution for EMS and PCB assembly production."
  },
  {
    slug: "s-4000",
    model: "S-4000",
    categoryLabel: "THT Axial Insertion",
    title: "S-4000 Axial Insertion Machine",
    subtitle:
      "Automated axial component insertion support for THT PCB assembly workflows."
  },
  {
    slug: "s7900",
    model: "S7900",
    categoryLabel: "Odd Form Insertion",
    title: "S7900 Odd Form Insertion Solution",
    subtitle:
      "Flexible odd form insertion solution for complex THT assembly requirements."
  },
  {
    slug: "s-680a",
    model: "S-680A",
    categoryLabel: "SMT Production Support",
    title: "S-680A SMT Reel Scrap Tape Cutter",
    subtitle:
      "SMT reel scrap tape cutting solution for cleaner material handling and production support."
  }
];

function buildDefaultContent(displayModel, productName) {
  const title =
    productName && productName !== "To be confirmed"
      ? productName
      : displayModel || "Product assets to be confirmed";

  return {
    title,
    productName: title,
    subtitle:
      "Product information and available documents for Southern Machinery SMT/THT equipment.",
    introduction:
      "This customer-facing page is generated from currently available public Southern Machinery file assets. Commercial and technical details remain to be confirmed from official document.",
    overviewTitle: "Product overview from available public assets",
    overviewText: `${
      displayModel || "This product"
    } is presented here using the currently available public asset set. Detailed configuration, performance, dimension, pricing, and certification information are to be confirmed from official document.`,
    keyBenefits: [
      ...BASE_BENEFITS,
      "Provides a starting point for customer communication using published file assets"
    ],
    applications: BASE_APPLICATIONS
  };
}

function buildMappedContent(entry) {
  const normalized = normalizeModel(entry.model);

  if (normalized === "s3000") {
    return {
      title: entry.title,
      productName: "Radial Insertion Machine",
      subtitle: entry.subtitle,
      introduction:
        "This page uses currently available public Southern Machinery assets to introduce the S-3000 as a radial insertion solution for THT assembly review and customer discussion.",
      overviewTitle: "Radial insertion support for THT assembly workflows",
      overviewText:
        "The S-3000 is positioned in the available public assets as a radial insertion solution for THT PCB assembly and EMS production environments. Speed, accuracy, dimension, tooling, and process capability details are to be confirmed from official document.",
      keyBenefits: [
        "Supports automated radial component insertion",
        "Helps improve THT assembly consistency",
        "Suitable for EMS production workflows",
        "Reduces repetitive manual insertion work",
        "Can be reviewed with available product documents"
      ],
      applications: [
        "EMS factories",
        "THT PCB assembly",
        "Smart electronics production",
        "Automotive electronics control boards",
        "Industrial electronics PCB assembly"
      ]
    };
  }

  if (normalized === "s4000") {
    return {
      title: entry.title,
      productName: "Axial Insertion Machine",
      subtitle: entry.subtitle,
      introduction:
        "This page is generated from customer-visible Southern Machinery assets and provides a conservative overview of the S-4000 for THT axial insertion discussions.",
      overviewTitle: "Axial insertion support for THT PCB assembly",
      overviewText:
        "The S-4000 is represented in the available asset set as an axial insertion machine for THT production support. Final machine scope, supported component range, throughput, and configuration details are to be confirmed from official document.",
      keyBenefits: [
        "Supports automated axial component insertion workflows",
        "Helps improve consistency in THT production review",
        "Suitable for electronics assembly planning and quotation discussions",
        "Reduces dependence on repetitive manual insertion tasks",
        "Can be reviewed with available product documents"
      ],
      applications: [
        "THT PCB assembly",
        "EMS production workflows",
        "Consumer electronics manufacturing",
        "Industrial electronics assembly",
        "Customer quotation and process evaluation"
      ]
    };
  }

  if (normalized === "s7900") {
    return {
      title: entry.title,
      productName: "Odd Form Insertion Solution",
      subtitle: entry.subtitle,
      introduction:
        "This page summarizes the customer-visible Southern Machinery assets currently linked to the S7900 and presents a cautious overview for odd form insertion discussions.",
      overviewTitle: "Odd form insertion positioning from current public assets",
      overviewText:
        "The S7900 appears in the current asset set as an odd form insertion solution intended for more complex THT assembly requirements. Detailed tooling scope, feeder configuration, and production capability are to be confirmed from official document.",
      keyBenefits: [
        "Supports odd form insertion review for complex board assemblies",
        "Helps organize product references for customer quotation preparation",
        "Suitable for mixed THT production discussions",
        "Provides a structured starting point for document-led product communication",
        "Can be reviewed with available product documents"
      ],
      applications: [
        "Complex THT assembly lines",
        "Mixed electronics manufacturing workflows",
        "Automotive and industrial control boards",
        "EMS factories with odd form component handling",
        "Customer evaluation of insertion process options"
      ]
    };
  }

  if (normalized === "s680a") {
    return {
      title: entry.title,
      productName: "SMT Reel Scrap Tape Cutter",
      subtitle: entry.subtitle,
      introduction:
        "This page is generated from customer-visible Southern Machinery assets for the S-680A and presents a conservative overview for scrap tape cutting workflow discussions.",
      overviewTitle: "Material handling support for SMT production lines",
      overviewText:
        "The S-680A is presented in the available public assets as a scrap tape cutting solution for SMT production support. Detailed operating capacity, blade configuration, and integration options are to be confirmed from official document.",
      keyBenefits: [
        "Supports cleaner scrap tape handling in SMT workflows",
        "Helps improve production-area organization and housekeeping",
        "Suitable for supporting reel-based material handling processes",
        "Reduces repetitive manual scrap tape handling work",
        "Can be reviewed with available product documents"
      ],
      applications: [
        "SMT production support",
        "Reel material handling workflows",
        "Electronics assembly lines",
        "Factory housekeeping and scrap handling improvement",
        "Process review for supporting production equipment"
      ]
    };
  }

  return buildDefaultContent(entry.model, entry.title);
}

export function getFeaturedLandingPageByModel(model) {
  const token = normalizeModel(model);
  return FEATURED_LANDING_PAGES.find(
    (entry) => normalizeModel(entry.model) === token
  );
}

export function getFeaturedLandingPageBySlug(slug) {
  const token = normalizeModel(slug);
  return FEATURED_LANDING_PAGES.find(
    (entry) => normalizeModel(entry.slug) === token
  );
}

export function getProductLandingContent({
  productSlug,
  displayModel,
  productName
}) {
  const mapped =
    getFeaturedLandingPageBySlug(productSlug) ||
    getFeaturedLandingPageByModel(displayModel);

  if (mapped) {
    return buildMappedContent(mapped);
  }

  return buildDefaultContent(displayModel, productName);
}
