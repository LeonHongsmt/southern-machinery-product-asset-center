const fs = require("node:fs/promises");
const path = require("node:path");

const { validateProductAsset } = require("../schema/productAssetSchema.js");

const INPUT_PATH = path.resolve(__dirname, "../../data/file_site_samples.json");
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const OUTPUT_PUBLIC_JSON_PATH = path.resolve(
  __dirname,
  "../../public/data/product_assets.json"
);
const OUTPUT_REPORT_PATH = path.resolve(
  __dirname,
  "../../data/product_assets_report.md"
);

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values.filter((value) => typeof value === "string" && value.trim().length > 0)
    )
  );
}

function getExtension(fileName) {
  const normalized = String(fileName || "").toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index + 1) : "";
}

function detectFileTypeFromName(fileName) {
  const lowerName = String(fileName || "").toLowerCase();
  const ext = getExtension(fileName);

  const imageExts = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "avif",
    "bmp",
  ]);
  const audioExts = new Set(["wav", "mp3", "m4a", "aac", "flac", "ogg"]);

  if (imageExts.has(ext)) {
    return "image";
  }

  if (audioExts.has(ext)) {
    return "audio";
  }

  if (ext === "pdf") {
    if (
      lowerName.includes("manual") ||
      lowerName.includes("product manual") ||
      lowerName.includes("guide") ||
      lowerName.includes("instruction") ||
      lowerName.includes("operation") ||
      lowerName.includes("user")
    ) {
      return "manual";
    }

    return "pdf";
  }

  if (ext === "html" || ext === "htm") {
    return "document";
  }

  return "other";
}

function buildGroupKey(sample) {
  if (sample.product_model === "unknown_model") {
    return `${sample.product_model}::${sample.category}::${sample.file_name}::${sample.source_url}`;
  }

  return `${sample.product_model}::${sample.category}`;
}

function selectProductName(samples) {
  const candidate = samples.find((sample) => {
    const value = String(sample.product_name || "").trim();
    return value && value.toLowerCase() !== "to be confirmed";
  });

  if (candidate) {
    return candidate.product_name;
  }

  const productModel = String(samples[0]?.product_model || "").trim();
  if (productModel && productModel !== "unknown_model") {
    return productModel;
  }

  return "To be confirmed";
}

function selectPrimaryFileType(samples) {
  const detectedTypes = samples.map((sample) => detectFileTypeFromName(sample.file_name));
  const priority = ["image", "pdf", "manual", "audio", "document", "other"];

  for (const fileType of priority) {
    if (detectedTypes.includes(fileType)) {
      return fileType;
    }
  }

  return "other";
}

function createAggregatedAsset(samples, generatedAt) {
  const first = samples[0];
  const pdfLinks = [];
  const imageLinks = [];
  const manualLinks = [];
  const fileNames = [];
  const remarks = [];

  for (const sample of samples) {
    fileNames.push(sample.file_name);

    if (Array.isArray(sample.pdf_links)) {
      pdfLinks.push(...sample.pdf_links);
    }
    if (Array.isArray(sample.image_links)) {
      imageLinks.push(...sample.image_links);
    }
    if (Array.isArray(sample.manual_links)) {
      manualLinks.push(...sample.manual_links);
    }

    if (sample.remarks) {
      remarks.push(sample.remarks);
    }
  }

  const distinctFileNames = uniqueStrings(fileNames);
  const productModel = first.product_model || "unknown_model";
  const aggregatedRemarks = uniqueStrings(remarks);

  if (productModel === "unknown_model") {
    aggregatedRemarks.push("Needs manual review: product model not detected");
  }

  if (distinctFileNames.length > 1) {
    aggregatedRemarks.push(
      `Grouped ${distinctFileNames.length} sample files under the same product_model + category`
    );
  }

  return {
    product_model: productModel,
    product_name: selectProductName(samples),
    category: first.category || "uncategorized",
    file_name: first.file_name || "To be confirmed",
    file_type: selectPrimaryFileType(samples),
    pdf_links: uniqueStrings(pdfLinks),
    image_links: uniqueStrings(imageLinks),
    manual_links: uniqueStrings(manualLinks),
    source_url: first.source_url || "https://file.autoinsertion.com/#/",
    description: "To be confirmed from official document",
    remarks: aggregatedRemarks.join(" | "),
    created_at: generatedAt,
    updated_at: generatedAt,
  };
}

function createAssetTypeCounts(assets) {
  return assets.reduce(
    (counts, asset) => {
      const fileType = asset.file_type || "other";
      counts[fileType] = (counts[fileType] || 0) + 1;
      return counts;
    },
    {
      pdf: 0,
      image: 0,
      manual: 0,
      audio: 0,
      document: 0,
      other: 0,
    }
  );
}

function createReport(params) {
  const {
    generatedAt,
    inputSamplesCount,
    outputAssetsCount,
    assetTypeCounts,
    totalPdfLinks,
    totalImageLinks,
    totalManualLinks,
    unknownModelCount,
    invalidRecords,
    manualReviewItems,
  } = params;

  const invalidLines = invalidRecords.length
    ? invalidRecords.map((record) => {
        return `- ${record.product_model} / ${record.category}: ${record.errors.join("; ")}`;
      })
    : ["- None"];

  const reviewLines = manualReviewItems.length
    ? manualReviewItems.map((item) => `- ${item}`)
    : ["- None"];

  return [
    "# Product Assets Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Input sample count: ${inputSamplesCount}`,
    `- Output product asset count: ${outputAssetsCount}`,
    `- PDF link count: ${totalPdfLinks}`,
    `- Image link count: ${totalImageLinks}`,
    `- Manual / Document / Audio link count: ${totalManualLinks}`,
    `- unknown_model count: ${unknownModelCount}`,
    `- Validation failure count: ${invalidRecords.length}`,
    "",
    "## Output file_type counts",
    "",
    `- pdf: ${assetTypeCounts.pdf}`,
    `- image: ${assetTypeCounts.image}`,
    `- manual: ${assetTypeCounts.manual}`,
    `- audio: ${assetTypeCounts.audio}`,
    `- document: ${assetTypeCounts.document}`,
    `- other: ${assetTypeCounts.other}`,
    "",
    "## Invalid records",
    "",
    ...invalidLines,
    "",
    "## Manual review items",
    "",
    ...reviewLines,
    "",
    "## Next-step notes",
    "",
    "- Keep unknown_model records for manual review instead of forcing a guessed model.",
    "- Audio files are now classified as audio and can be governed by visibility rules without deleting them.",
    "- Use product_model_mapping.json for high-confidence model normalization and naming cleanup.",
    "",
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const samples = JSON.parse(raw);

  if (!Array.isArray(samples)) {
    throw new Error("data/file_site_samples.json must be an array.");
  }

  const groups = new Map();
  for (const sample of samples) {
    const key = buildGroupKey(sample);
    const bucket = groups.get(key) || [];
    bucket.push(sample);
    groups.set(key, bucket);
  }

  const aggregatedAssets = [];
  const invalidRecords = [];

  for (const groupSamples of groups.values()) {
    const asset = createAggregatedAsset(groupSamples, generatedAt);
    const validation = validateProductAsset(asset);

    if (!validation.valid) {
      invalidRecords.push({
        product_model: asset.product_model,
        category: asset.category,
        errors: validation.errors,
      });
    }

    aggregatedAssets.push(asset);
  }

  aggregatedAssets.sort((a, b) => {
    const aUnknown = a.product_model === "unknown_model" ? 1 : 0;
    const bUnknown = b.product_model === "unknown_model" ? 1 : 0;

    if (aUnknown !== bUnknown) {
      return aUnknown - bUnknown;
    }

    const categoryCompare = String(a.category || "").localeCompare(String(b.category || ""));
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return String(a.product_model || "").localeCompare(String(b.product_model || ""));
  });

  const totalPdfLinks = aggregatedAssets.reduce((sum, asset) => sum + asset.pdf_links.length, 0);
  const totalImageLinks = aggregatedAssets.reduce(
    (sum, asset) => sum + asset.image_links.length,
    0
  );
  const totalManualLinks = aggregatedAssets.reduce(
    (sum, asset) => sum + asset.manual_links.length,
    0
  );
  const unknownModelAssets = aggregatedAssets.filter(
    (asset) => asset.product_model === "unknown_model"
  );
  const manualReviewItems = unknownModelAssets.map((asset) => {
    return `${asset.category} / ${asset.file_name}`;
  });
  const assetTypeCounts = createAssetTypeCounts(aggregatedAssets);
  const outputJson = `${JSON.stringify(aggregatedAssets, null, 2)}\n`;

  await Promise.all([
    fs.writeFile(OUTPUT_JSON_PATH, outputJson, "utf8"),
    fs.writeFile(OUTPUT_PUBLIC_JSON_PATH, outputJson, "utf8"),
  ]);

  const report = createReport({
    generatedAt,
    inputSamplesCount: samples.length,
    outputAssetsCount: aggregatedAssets.length,
    assetTypeCounts,
    totalPdfLinks,
    totalImageLinks,
    totalManualLinks,
    unknownModelCount: unknownModelAssets.length,
    invalidRecords,
    manualReviewItems,
  });

  await fs.writeFile(OUTPUT_REPORT_PATH, `\uFEFF${report}\n`, "utf8");

  console.log(`Input sample count: ${samples.length}`);
  console.log(`Output product asset count: ${aggregatedAssets.length}`);
  console.log(`PDF link count: ${totalPdfLinks}`);
  console.log(`Image link count: ${totalImageLinks}`);
  console.log(`Manual/document/audio link count: ${totalManualLinks}`);
  console.log(`unknown_model count: ${unknownModelAssets.length}`);
  console.log(`Invalid record count: ${invalidRecords.length}`);
  console.log(`Data output: ${OUTPUT_JSON_PATH}`);
  console.log(`Public output: ${OUTPUT_PUBLIC_JSON_PATH}`);
  console.log(`Report output: ${OUTPUT_REPORT_PATH}`);
}

main().catch((error) => {
  console.error("buildProductAssetsFromSamples.js failed.");
  console.error(error);
  process.exitCode = 1;
});
