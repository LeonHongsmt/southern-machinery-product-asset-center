const CONFIRMATION_NOTE = "To be confirmed from official document.";

function normalizeRaw(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function uniqueLinks(assets, key) {
  return Array.from(
    new Set(
      assets.flatMap((asset) => (Array.isArray(asset?.[key]) ? asset[key] : []))
    )
  );
}

function buildSearchSource(product, assets) {
  const assetText = assets
    .map((asset) =>
      [
        asset.product_model,
        asset.product_name,
        asset.category,
        asset.file_name,
        asset.source_url
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");

  const raw = [
    product?.productModel,
    product?.productName,
    product?.category,
    product?.fileName,
    product?.title,
    assetText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    raw,
    token: normalizeToken(raw)
  };
}

function hasPhrase(raw, phrases) {
  return phrases.some((phrase) => raw.includes(phrase));
}

function hasToken(tokenSource, tokens) {
  return tokens.some((token) => tokenSource.includes(token));
}

function detectProductType(product, assets) {
  const source = buildSearchSource(product, assets);

  if (
    hasPhrase(source.raw, ["radial"]) ||
    hasToken(source.token, ["s3000", "s3010a"])
  ) {
    return "radial_insertion";
  }

  if (
    hasPhrase(source.raw, ["axial"]) ||
    hasToken(source.token, ["s4000"])
  ) {
    return "axial_insertion";
  }

  if (
    hasPhrase(source.raw, ["odd form", "oddform"]) ||
    hasToken(source.token, ["s7900", "s7000"])
  ) {
    return "odd_form_insertion";
  }

  if (
    hasPhrase(source.raw, ["scrap tape", "tape cutter"]) ||
    hasToken(source.token, ["s680a"])
  ) {
    return "scrap_tape_cutter";
  }

  if (
    hasPhrase(source.raw, ["reflow", "oven"]) ||
    hasToken(source.token, ["s6600", "s8800"])
  ) {
    return "reflow_oven";
  }

  if (
    hasPhrase(source.raw, ["agv"]) ||
    hasToken(source.token, ["sfy03"])
  ) {
    return "agv";
  }

  if (
    hasPhrase(source.raw, ["cleaning", "cleaner"]) ||
    hasToken(source.token, ["ac510", "bc320", "sme5200"])
  ) {
    return "cleaning_machine";
  }

  return "default";
}

function buildAssetAvailabilityText(assets) {
  const pdfCount = uniqueLinks(assets, "pdf_links").length;
  const imageCount = uniqueLinks(assets, "image_links").length;
  const documentCount = uniqueLinks(assets, "manual_links").length;

  if (!pdfCount && !imageCount && !documentCount) {
    return `The current public asset set is limited. ${CONFIRMATION_NOTE}`;
  }

  const parts = [];
  if (pdfCount) {
    parts.push(`${pdfCount} PDF link${pdfCount === 1 ? "" : "s"}`);
  }
  if (documentCount) {
    parts.push(`${documentCount} document link${documentCount === 1 ? "" : "s"}`);
  }
  if (imageCount) {
    parts.push(`${imageCount} image link${imageCount === 1 ? "" : "s"}`);
  }

  return `The current public asset set includes ${parts.join(", ")}.`;
}

function buildFaq(title, assets) {
  const assetAvailability = buildAssetAvailabilityText(assets);

  return [
    {
      question: "What documents are available for this product?",
      answer: `${assetAvailability} Please contact Southern Machinery for the latest document package and confirmation of the customer-ready file set.`
    },
    {
      question: "Can I request a quotation for this machine?",
      answer: `Yes. You can use the quotation request action on this page to contact Southern Machinery about ${title}. Final commercial scope should be confirmed directly with the sales team.`
    },
    {
      question: "Are technical specifications confirmed?",
      answer: CONFIRMATION_NOTE
    },
    {
      question: "How should I verify the final configuration?",
      answer: `Please review the available product assets together with Southern Machinery sales and engineering contacts. Final configuration, options, and application fit should be confirmed before customer-facing use.`
    }
  ];
}

function buildTypeCopy(type, product) {
  const title = product?.title || product?.productName || product?.productModel || "this product";

  switch (type) {
    case "radial_insertion":
      return {
        subtitle:
          "Automated THT radial component insertion solution for EMS and PCB assembly production.",
        overview:
          `This page presents ${title} as a radial insertion solution for THT PCB assembly review. It is positioned for document-led customer discussion and internal sales alignment, while final machine configuration remains ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports repeatable THT radial component insertion workflows",
          "Helps improve assembly consistency across production review discussions",
          "Suitable for EMS and mixed-model assembly environments",
          "Reduces repetitive manual insertion handling in process planning",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "EMS production",
          "THT PCB assembly",
          "Smart electronics manufacturing",
          "Automotive electronics control boards",
          "Industrial electronics assembly"
        ],
        ctaNote:
          "Contact Southern Machinery to review available radial insertion documents, confirm configuration, and request a quotation."
      };
    case "axial_insertion":
      return {
        subtitle:
          "Automated axial component insertion support for THT PCB assembly workflows.",
        overview:
          `This page presents ${title} as an axial insertion solution for THT assembly review and quotation preparation. Machine scope, supported component range, and final specification details remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports automated axial component insertion planning",
          "Helps improve consistency in THT production review",
          "Suitable for structured sales and engineering evaluation",
          "Reduces reliance on repetitive manual insertion discussion points",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "THT PCB assembly",
          "EMS production workflows",
          "Consumer electronics manufacturing",
          "Industrial electronics assembly",
          "Customer quotation and process evaluation"
        ],
        ctaNote:
          "Contact Southern Machinery to review available axial insertion documents, confirm machine scope, and request a quotation."
      };
    case "odd_form_insertion":
      return {
        subtitle:
          "Flexible odd form insertion solution for complex THT assembly requirements.",
        overview:
          `This page presents ${title} as an odd form insertion solution for more complex THT assembly requirements. Final feeder scope, supported applications, and machine configuration remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports flexible odd form insertion review for complex assemblies",
          "Helps organize customer-facing discussion around mixed THT requirements",
          "Suitable for EMS and industrial electronics production planning",
          "Reduces repetitive manual handling considerations during process review",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "Complex THT assembly lines",
          "Mixed electronics manufacturing workflows",
          "Industrial electronics boards",
          "Automotive electronics control assemblies",
          "EMS production with odd form components"
        ],
        ctaNote:
          "Contact Southern Machinery to review available odd form insertion assets, confirm application fit, and request a quotation."
      };
    case "scrap_tape_cutter":
      return {
        subtitle:
          "SMT reel scrap tape cutting solution for cleaner material handling and production support.",
        overview:
          `This page presents ${title} as a support solution for SMT reel scrap tape handling. Final operating scope, installation method, and workflow fit remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports cleaner material handling around SMT production lines",
          "Helps reduce repetitive scrap tape handling work",
          "Provides a practical reference point for support equipment review",
          "Suitable for improving production-area organization discussions",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "SMT production support",
          "Reel material handling workflows",
          "Electronics assembly lines",
          "Production housekeeping improvement",
          "Factory support equipment planning"
        ],
        ctaNote:
          "Contact Southern Machinery to review available support equipment documents, confirm workflow fit, and request a quotation."
      };
    case "reflow_oven":
      return {
        subtitle:
          "SMT reflow process support for PCB assembly production environments.",
        overview:
          `This page presents ${title} as part of the SMT reflow process support equipment range. Final thermal configuration, zone details, and production suitability remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports SMT reflow process planning",
          "Provides a structured reference point for line configuration review",
          "Suitable for PCB assembly production discussions",
          "Helps align sales and engineering review around available documents",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "SMT PCB assembly",
          "Electronics production lines",
          "Consumer electronics manufacturing",
          "Industrial electronics assembly",
          "Production process review"
        ],
        ctaNote:
          "Contact Southern Machinery to review available reflow oven documents, confirm process requirements, and request a quotation."
      };
    case "agv":
      return {
        subtitle:
          "SMT line material movement support for flexible production logistics.",
        overview:
          `This page presents ${title} as a logistics-support solution for SMT production flow. Final routing logic, payload scope, and integration details remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports flexible material movement review in SMT environments",
          "Helps organize production logistics discussions",
          "Suitable for line-to-line handoff planning",
          "Provides a structured reference point for factory automation review",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "SMT line material movement",
          "Production logistics planning",
          "Electronics manufacturing support",
          "Flexible factory workflow review",
          "Internal transport process evaluation"
        ],
        ctaNote:
          "Contact Southern Machinery to review available AGV documents, confirm workflow requirements, and request a quotation."
      };
    case "cleaning_machine":
      return {
        subtitle:
          "Cleaning support solution for PCBA, stencil, pallet, or related production workflows.",
        overview:
          `This page presents ${title} as part of a cleaning support workflow for electronics manufacturing. Final cleaning process scope, compatible applications, and operating details remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Supports cleaning workflow review for electronics production",
          "Helps reduce repetitive manual cleaning discussion points",
          "Suitable for PCBA, stencil, or pallet process planning",
          "Provides a structured reference point for sales and engineering review",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "PCBA cleaning support",
          "Stencil cleaning workflows",
          "Pallet cleaning review",
          "Electronics production maintenance planning",
          "Manufacturing process support"
        ],
        ctaNote:
          "Contact Southern Machinery to review available cleaning equipment documents, confirm process scope, and request a quotation."
      };
    default:
      return {
        subtitle:
          "Southern Machinery SMT/THT equipment asset page with available product documents.",
        overview:
          `This page presents ${title} using the current public Southern Machinery asset set. Final technical configuration, commercial scope, and application suitability remain ${CONFIRMATION_NOTE.toLowerCase()}`,
        keyBenefits: [
          "Provides a structured reference point for sales and engineering review",
          "Helps organize currently available public product assets",
          "Supports document-led customer communication without unconfirmed claims",
          "Useful for early-stage product review and quotation preparation",
          "Can be reviewed together with available product documents"
        ],
        applications: [
          "EMS production review",
          "SMT and THT equipment evaluation",
          "Electronics manufacturing support",
          "Industrial production planning",
          "Customer quotation preparation"
        ],
        ctaNote:
          "Contact Southern Machinery to review available documents, confirm machine configuration, and request a quotation."
      };
  }
}

export function generateProductMarketingCopy(product, assets = []) {
  const safeAssets = Array.isArray(assets) ? assets : [];
  const type = detectProductType(product, safeAssets);
  const typeCopy = buildTypeCopy(type, product);

  return {
    subtitle: typeCopy.subtitle,
    overview: typeCopy.overview,
    keyBenefits: typeCopy.keyBenefits,
    applications: typeCopy.applications,
    faq: buildFaq(product?.title || product?.productName || product?.productModel, safeAssets),
    ctaNote: typeCopy.ctaNote
  };
}
