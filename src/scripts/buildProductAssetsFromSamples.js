const fs = require("node:fs/promises");
const path = require("node:path");

const { validateProductAsset } = require("../schema/productAssetSchema.js");

const INPUT_PATH = path.resolve(__dirname, "../../data/file_site_samples.json");
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const OUTPUT_REPORT_PATH = path.resolve(__dirname, "../../data/product_assets_report.md");

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values.filter((value) => typeof value === "string" && value.trim().length > 0)
    )
  );
}

function buildGroupKey(sample) {
  if (sample.product_model === "unknown_model") {
    return `${sample.product_model}::${sample.category}::${sample.file_name}`;
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

function selectPrimaryFileType(typeCounts) {
  const entries = Object.entries(typeCounts).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return "other";
  }

  if (entries.length === 1) {
    return entries[0][0];
  }

  const onlyManualAndDocument = entries.every(([type]) => type === "manual" || type === "document");
  if (onlyManualAndDocument) {
    return "manual";
  }

  return "other";
}

function createAggregatedAsset(samples, generatedAt) {
  const first = samples[0];
  const typeCounts = {
    pdf: 0,
    image: 0,
    manual: 0,
    document: 0,
    other: 0,
  };

  const pdfLinks = [];
  const imageLinks = [];
  const manualLinks = [];
  const sourceUrls = [];
  const fileNames = [];
  const remarks = [];

  for (const sample of samples) {
    typeCounts[sample.file_type] = (typeCounts[sample.file_type] || 0) + 1;
    fileNames.push(sample.file_name);
    sourceUrls.push(sample.source_url);

    if (Array.isArray(sample.pdf_links)) {
      pdfLinks.push(...sample.pdf_links);
    }
    if (Array.isArray(sample.image_links)) {
      imageLinks.push(...sample.image_links);
    }
    if (Array.isArray(sample.manual_links)) {
      manualLinks.push(...sample.manual_links);
    }

    // document 类型没有独立字段，沿用 manual_links 作为文档入口集合。
    if (sample.file_type === "document" && sample.source_url) {
      manualLinks.push(sample.source_url);
    }

    if (sample.remarks) {
      remarks.push(sample.remarks);
    }
  }

  const productModel = first.product_model || "unknown_model";
  const aggregatedRemarks = uniqueStrings(remarks);

  if (productModel === "unknown_model") {
    aggregatedRemarks.push("Needs manual review: product model not detected");
  }

  if (uniqueStrings(fileNames).length > 1) {
    aggregatedRemarks.push(
      `Grouped ${uniqueStrings(fileNames).length} sample files under the same product_model + category`
    );
  }

  return {
    product_model: productModel,
    product_name: selectProductName(samples),
    category: first.category || "uncategorized",
    file_name: first.file_name || "To be confirmed",
    file_type: selectPrimaryFileType(typeCounts),
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

function createReport(params) {
  const {
    generatedAt,
    inputSamplesCount,
    outputAssetsCount,
    totalPdfLinks,
    totalImageLinks,
    totalManualLinks,
    unknownModelCount,
    invalidRecords,
    manualReviewItems,
  } = params;

  const invalidLines = invalidRecords.length
    ? invalidRecords.map((record) => {
        return `- ${record.product_model} / ${record.category}：${record.errors.join("; ")}`;
      })
    : ["- 无"];

  const reviewLines = manualReviewItems.length
    ? manualReviewItems.map((item) => `- ${item}`)
    : ["- 无"];

  return [
    "# Product Assets Report",
    "",
    `生成时间：${generatedAt}`,
    "",
    "## 汇总",
    "",
    `- 输入样本数量：${inputSamplesCount}`,
    `- 输出产品资产数量：${outputAssetsCount}`,
    `- PDF 链接数量：${totalPdfLinks}`,
    `- 图片链接数量：${totalImageLinks}`,
    `- Manual / Document 链接数量：${totalManualLinks}`,
    `- unknown_model 数量：${unknownModelCount}`,
    `- 校验失败记录数量：${invalidRecords.length}`,
    "",
    "## invalid_records",
    "",
    ...invalidLines,
    "",
    "## 待人工复核项",
    "",
    ...reviewLines,
    "",
    "## 下一步建议",
    "",
    "- 先人工复核 unknown_model 和被聚合的多文件产品，确认是否需要补充正式产品名称。",
    "- 如果当前 20 条样本的聚合方式满足预期，可以在不下载文件内容的前提下继续扩大公开样本。",
    "- 在字段和聚合规则稳定后，再把 product_assets.json 接到前端静态模板读取。",
    "",
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const samples = JSON.parse(raw);

  if (!Array.isArray(samples)) {
    throw new Error("data/file_site_samples.json 必须是数组");
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

  const totalPdfLinks = aggregatedAssets.reduce((sum, asset) => sum + asset.pdf_links.length, 0);
  const totalImageLinks = aggregatedAssets.reduce((sum, asset) => sum + asset.image_links.length, 0);
  const totalManualLinks = aggregatedAssets.reduce((sum, asset) => sum + asset.manual_links.length, 0);
  const unknownModelAssets = aggregatedAssets.filter(
    (asset) => asset.product_model === "unknown_model"
  );

  const manualReviewItems = unknownModelAssets.map((asset) => {
    return `${asset.category} / ${asset.file_name}`;
  });

  await fs.writeFile(
    OUTPUT_JSON_PATH,
    `${JSON.stringify(aggregatedAssets, null, 2)}\n`,
    "utf8"
  );

  const report = createReport({
    generatedAt,
    inputSamplesCount: samples.length,
    outputAssetsCount: aggregatedAssets.length,
    totalPdfLinks,
    totalImageLinks,
    totalManualLinks,
    unknownModelCount: unknownModelAssets.length,
    invalidRecords,
    manualReviewItems,
  });

  await fs.writeFile(OUTPUT_REPORT_PATH, report, "utf8");

  console.log(`Input sample count: ${samples.length}`);
  console.log(`Output product asset count: ${aggregatedAssets.length}`);
  console.log(`PDF link count: ${totalPdfLinks}`);
  console.log(`Image link count: ${totalImageLinks}`);
  console.log(`Manual/document link count: ${totalManualLinks}`);
  console.log(`unknown_model count: ${unknownModelAssets.length}`);
  console.log(`Invalid record count: ${invalidRecords.length}`);
}

main().catch((error) => {
  console.error("buildProductAssetsFromSamples.js failed.");
  console.error(error);
  process.exitCode = 1;
});
