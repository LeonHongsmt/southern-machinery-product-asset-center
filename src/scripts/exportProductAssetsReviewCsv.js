const fs = require("node:fs/promises");
const path = require("node:path");

const INPUT_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const OUTPUT_CSV_PATH = path.resolve(
  __dirname,
  "../../data/product_assets_review.csv"
);
const OUTPUT_REPORT_PATH = path.resolve(
  __dirname,
  "../../data/product_assets_review_report.md"
);
const STANDARDIZATION_REPORT_PATH = path.resolve(
  __dirname,
  "../../data/data_standardization_report.md"
);

const CSV_HEADERS = [
  "review_status",
  "visibility",
  "product_model",
  "product_name",
  "category",
  "file_type",
  "file_name",
  "source_url",
  "pdf_links",
  "image_links",
  "manual_links",
  "description",
  "remarks",
  "visibility_reason",
  "needs_manual_review",
  "suggested_action",
  "human_correct_product_model",
  "human_correct_product_name",
  "human_correct_category",
  "human_visibility_decision",
  "human_notes",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function joinLinks(values) {
  if (!Array.isArray(values)) {
    return "";
  }

  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join("; ");
}

function needsManualReview(asset) {
  const remarks = normalizeText(asset.remarks).toLowerCase();
  return (
    asset.product_model === "unknown_model" ||
    remarks.includes("review") ||
    remarks.includes("manual confirmation") ||
    asset.visibility === "internal_review" ||
    asset.visibility === "hidden"
  );
}

function getSuggestedAction(asset) {
  if (asset.product_model === "unknown_model") {
    return "Confirm product model";
  }

  if (asset.visibility === "hidden") {
    return "Check whether this asset should remain hidden";
  }

  if (asset.visibility === "internal_review") {
    return "Review before customer-facing use";
  }

  return "Verify and approve";
}

function createCsvRow(asset) {
  return {
    review_status: "",
    visibility: normalizeText(asset.visibility) || "public",
    product_model: normalizeText(asset.product_model),
    product_name: normalizeText(asset.product_name),
    category: normalizeText(asset.category),
    file_type: normalizeText(asset.file_type),
    file_name: normalizeText(asset.file_name),
    source_url: normalizeText(asset.source_url),
    pdf_links: joinLinks(asset.pdf_links),
    image_links: joinLinks(asset.image_links),
    manual_links: joinLinks(asset.manual_links),
    description: normalizeText(asset.description),
    remarks: normalizeText(asset.remarks),
    visibility_reason: normalizeText(asset.visibility_reason),
    needs_manual_review: needsManualReview(asset) ? "yes" : "no",
    suggested_action: getSuggestedAction(asset),
    human_correct_product_model: "",
    human_correct_product_name: "",
    human_correct_category: "",
    human_visibility_decision: "",
    human_notes: "",
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');

  if (/[",\r\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function serializeCsv(rows) {
  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) => {
      return CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(",");
    }),
  ];

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function createReviewReport(params) {
  const {
    exportedAt,
    totalRecords,
    publicCount,
    internalReviewCount,
    hiddenCount,
    unknownModelCount,
    needsManualReviewCount,
    outputPath,
  } = params;

  return [
    "# Product Assets Review CSV Report",
    "",
    `导出时间：${exportedAt}`,
    "",
    "## 汇总",
    "",
    `- 总记录数：${totalRecords}`,
    `- public 数量：${publicCount}`,
    `- internal_review 数量：${internalReviewCount}`,
    `- hidden 数量：${hiddenCount}`,
    `- unknown_model 数量：${unknownModelCount}`,
    `- needs_manual_review=yes 数量：${needsManualReviewCount}`,
    `- CSV 输出路径：${outputPath}`,
    "",
    "## 人工审核建议",
    "",
    "1. 先处理 unknown_model，确认能否补充真实产品型号。",
    "2. 再处理 hidden，确认这些资料是否应继续隐藏，或是否仅适合内部使用。",
    "3. 再处理 internal_review，确认是否可以转为 public 展示。",
    "4. 最后处理 public 记录的命名规范、分类一致性和文案清理。",
    "",
  ].join("\n");
}

function createStandardizationReport(params) {
  const {
    exportedAt,
    audioCount,
    modelStandardizationCount,
    productNameCorrectionCount,
    unknownModelCount,
    visibilityCounts,
    reviewAssets,
  } = params;

  const reviewLines = reviewAssets.length
    ? reviewAssets.map((asset) => {
        return `- ${asset.product_model} | ${asset.file_name} | ${asset.visibility} | ${asset.remarks || "No remarks"}`;
      })
    : ["- None"];

  return [
    "# Data Standardization Report",
    "",
    `执行时间：${exportedAt}`,
    "",
    "## 汇总",
    "",
    `- audio 文件识别数量：${audioCount}`,
    `- 型号标准化命中数量：${modelStandardizationCount}`,
    `- 产品名称修正数量：${productNameCorrectionCount}`,
    `- unknown_model 数量：${unknownModelCount}（本轮仍保留，不自动乱填）`,
    `- public 数量：${visibilityCounts.public}`,
    `- internal_review 数量：${visibilityCounts.internal_review}`,
    `- hidden 数量：${visibilityCounts.hidden}`,
    "",
    "## 仍需人工复核的记录",
    "",
    ...reviewLines,
    "",
    "## 下一步建议",
    "",
    "- 继续保留 unknown_model，等人工确认后再补充 mapping 规则。",
    "- 对 BG03、SQX350 这类名称不完整或偏短的记录，建议由销售或产品团队确认正式客户展示名。",
    "- 如果人工审核 CSV 已经有明确结论，下一步最值得做的是把审核结果回写到 mapping 和 visibility 规则。",
    "",
  ].join("\n");
}

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const assets = JSON.parse(raw);

  if (!Array.isArray(assets)) {
    throw new Error("data/product_assets.json must be an array.");
  }

  const rows = assets.map(createCsvRow);
  const exportedAt = new Date().toISOString();

  const counts = assets.reduce(
    (accumulator, asset) => {
      const visibility = normalizeText(asset.visibility) || "public";

      if (visibility === "public") {
        accumulator.public += 1;
      } else if (visibility === "internal_review") {
        accumulator.internal_review += 1;
      } else if (visibility === "hidden") {
        accumulator.hidden += 1;
      }

      if (asset.product_model === "unknown_model") {
        accumulator.unknown_model += 1;
      }

      if (asset.file_type === "audio") {
        accumulator.audio += 1;
      }

      const remarks = normalizeText(asset.remarks).toLowerCase();
      if (remarks.includes("standardized model format")) {
        accumulator.model_standardization += 1;
      }

      if (remarks.includes("standardized product name")) {
        accumulator.product_name_correction += 1;
      }

      if (needsManualReview(asset)) {
        accumulator.needs_manual_review += 1;
      }

      return accumulator;
    },
    {
      public: 0,
      internal_review: 0,
      hidden: 0,
      unknown_model: 0,
      audio: 0,
      model_standardization: 0,
      product_name_correction: 0,
      needs_manual_review: 0,
    }
  );

  const reviewAssets = assets.filter((asset) => needsManualReview(asset)).sort((a, b) => {
    const aUnknown = a.product_model === "unknown_model" ? 0 : 1;
    const bUnknown = b.product_model === "unknown_model" ? 0 : 1;
    if (aUnknown !== bUnknown) {
      return aUnknown - bUnknown;
    }

    return String(a.file_name || "").localeCompare(String(b.file_name || ""));
  });

  const csvContent = serializeCsv(rows);
  const reviewReportContent = createReviewReport({
    exportedAt,
    totalRecords: assets.length,
    publicCount: counts.public,
    internalReviewCount: counts.internal_review,
    hiddenCount: counts.hidden,
    unknownModelCount: counts.unknown_model,
    needsManualReviewCount: counts.needs_manual_review,
    outputPath: OUTPUT_CSV_PATH,
  });
  const standardizationReportContent = createStandardizationReport({
    exportedAt,
    audioCount: counts.audio,
    modelStandardizationCount: counts.model_standardization,
    productNameCorrectionCount: counts.product_name_correction,
    unknownModelCount: counts.unknown_model,
    visibilityCounts: {
      public: counts.public,
      internal_review: counts.internal_review,
      hidden: counts.hidden,
    },
    reviewAssets,
  });

  await Promise.all([
    fs.writeFile(OUTPUT_CSV_PATH, csvContent, "utf8"),
    fs.writeFile(OUTPUT_REPORT_PATH, `\uFEFF${reviewReportContent}\n`, "utf8"),
    fs.writeFile(
      STANDARDIZATION_REPORT_PATH,
      `\uFEFF${standardizationReportContent}\n`,
      "utf8"
    ),
  ]);

  console.log(`Exported ${assets.length} records to ${OUTPUT_CSV_PATH}`);
  console.log(
    `public=${counts.public}, internal_review=${counts.internal_review}, hidden=${counts.hidden}, unknown_model=${counts.unknown_model}, audio=${counts.audio}, needs_manual_review=${counts.needs_manual_review}`
  );
  console.log(`Review report written to ${OUTPUT_REPORT_PATH}`);
  console.log(`Standardization report written to ${STANDARDIZATION_REPORT_PATH}`);
}

main().catch((error) => {
  console.error("Failed to export product assets review CSV.");
  console.error(error);
  process.exitCode = 1;
});
