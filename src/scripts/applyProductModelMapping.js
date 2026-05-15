const fs = require("node:fs/promises");
const path = require("node:path");

const ASSET_INPUT_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const MAPPING_INPUT_PATH = path.resolve(
  __dirname,
  "../../data/product_model_mapping.json"
);
const ASSET_OUTPUT_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const PUBLIC_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../public/data/product_assets.json"
);
const REPORT_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../data/product_model_mapping_report.md"
);

const SUPPORTED_MATCH_TYPES = new Set([
  "filename_contains",
  "source_url_contains",
  "product_name_contains",
  "exact_file_name",
]);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function splitRemarks(remarks) {
  return String(remarks || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniqueStrings(values) {
  return Array.from(
    new Set(values.filter((value) => typeof value === "string" && value.trim()))
  );
}

function isValidRule(rule) {
  return (
    rule &&
    typeof rule === "object" &&
    SUPPORTED_MATCH_TYPES.has(rule.match_type) &&
    typeof rule.match_value === "string" &&
    rule.match_value.trim().length > 0
  );
}

function matchesRule(asset, rule) {
  const target = normalizeText(rule.match_value);

  if (rule.match_type === "filename_contains") {
    return normalizeText(asset.file_name).includes(target);
  }

  if (rule.match_type === "source_url_contains") {
    return normalizeText(asset.source_url).includes(target);
  }

  if (rule.match_type === "product_name_contains") {
    return normalizeText(asset.product_name).includes(target);
  }

  if (rule.match_type === "exact_file_name") {
    return normalizeText(asset.file_name) === target;
  }

  return false;
}

function sanitizeResolvedRemarks(remarksParts) {
  return remarksParts.filter((part) => {
    return !/needs manual review: product model not detected/i.test(part) &&
      !/product model not confidently detected/i.test(part);
  });
}

function applyRuleToAsset(asset, rule, generatedAt) {
  const nextAsset = { ...asset };
  const previousUnknown = asset.product_model === "unknown_model";

  if (typeof rule.product_model === "string" && rule.product_model.trim()) {
    nextAsset.product_model = rule.product_model.trim();
  }

  if (typeof rule.product_name === "string" && rule.product_name.trim()) {
    nextAsset.product_name = rule.product_name.trim();
  }

  if (typeof rule.category === "string" && rule.category.trim()) {
    nextAsset.category = rule.category.trim();
  }

  let remarksParts = splitRemarks(asset.remarks);

  if (previousUnknown && nextAsset.product_model !== "unknown_model") {
    remarksParts = sanitizeResolvedRemarks(remarksParts);
  }

  remarksParts.push(
    `Mapping applied: ${rule.match_type}=${rule.match_value}`
  );

  if (typeof rule.remarks === "string" && rule.remarks.trim()) {
    remarksParts.push(rule.remarks.trim());
  }

  nextAsset.remarks = uniqueStrings(remarksParts).join(" | ");
  nextAsset.updated_at = generatedAt;

  return {
    asset: nextAsset,
    correctedUnknown: previousUnknown && nextAsset.product_model !== "unknown_model",
  };
}

function createReport(params) {
  const {
    generatedAt,
    totalRecords,
    ruleCount,
    hitRecords,
    unknownBefore,
    unknownAfter,
    remainingManualReviewCount,
    unmatchedAssets,
  } = params;

  const hitLines = hitRecords.length
    ? hitRecords.map((item) => {
        return `- ${item.file_name} -> ${item.product_model} | rule: ${item.match_type}=${item.match_value}`;
      })
    : ["- 无"];

  const unmatchedLines = unmatchedAssets.length
    ? unmatchedAssets.map((asset) => {
        return `- ${asset.product_model} | ${asset.file_name} | ${asset.category}`;
      })
    : ["- 无"];

  return [
    "# Product Model Mapping Report",
    "",
    `执行时间：${generatedAt}`,
    "",
    "## 汇总",
    "",
    `- 总记录数：${totalRecords}`,
    `- mapping 规则数量：${ruleCount}`,
    `- 命中记录数量：${hitRecords.length}`,
    `- 修正前 unknown_model 数量：${unknownBefore}`,
    `- 修正后 unknown_model 数量：${unknownAfter}`,
    `- 修正 unknown_model 数量：${unknownBefore - unknownAfter}`,
    `- 仍需人工复核数量：${remainingManualReviewCount}`,
    "",
    "## 命中的规则",
    "",
    ...hitLines,
    "",
    "## 未匹配记录列表",
    "",
    ...unmatchedLines,
    "",
    "## 下一步人工复核建议",
    "",
    "- 继续优先补充 unknown_model 的人工判断规则，尤其是没有型号但明显属于设备资料的记录。",
    "- 对 3D 演示文件、音频文件和品牌资料，建议单独建立归类策略，避免误当作标准产品页资产。",
    "- 当 mapping 规则增加后，重新执行本脚本，再同步提交到 public/data/product_assets.json。",
    "",
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const [assetRaw, mappingRaw] = await Promise.all([
    fs.readFile(ASSET_INPUT_PATH, "utf8"),
    fs.readFile(MAPPING_INPUT_PATH, "utf8"),
  ]);

  const assets = JSON.parse(assetRaw);
  const mappingRules = JSON.parse(mappingRaw);

  if (!Array.isArray(assets)) {
    throw new Error("data/product_assets.json must be an array.");
  }

  if (!Array.isArray(mappingRules)) {
    throw new Error("data/product_model_mapping.json must be an array.");
  }

  const validRules = mappingRules.filter(isValidRule);
  const unknownBefore = assets.filter(
    (asset) => asset.product_model === "unknown_model"
  ).length;

  const hitRecords = [];
  const nextAssets = assets.map((asset) => {
    const matchedRule = validRules.find((rule) => matchesRule(asset, rule));

    if (!matchedRule) {
      return asset;
    }

    const result = applyRuleToAsset(asset, matchedRule, generatedAt);
    hitRecords.push({
      file_name: asset.file_name,
      product_model: result.asset.product_model,
      match_type: matchedRule.match_type,
      match_value: matchedRule.match_value,
      correctedUnknown: result.correctedUnknown,
    });

    return result.asset;
  });

  const unknownAfter = nextAssets.filter(
    (asset) => asset.product_model === "unknown_model"
  ).length;
  const matchedFileNames = new Set(hitRecords.map((item) => item.file_name));
  const unmatchedAssets = nextAssets.filter(
    (asset) => !matchedFileNames.has(asset.file_name)
  );
  const outputJson = `${JSON.stringify(nextAssets, null, 2)}\n`;

  await Promise.all([
    fs.writeFile(ASSET_OUTPUT_PATH, outputJson, "utf8"),
    fs.writeFile(PUBLIC_OUTPUT_PATH, outputJson, "utf8"),
  ]);

  const report = createReport({
    generatedAt,
    totalRecords: nextAssets.length,
    ruleCount: validRules.length,
    hitRecords,
    unknownBefore,
    unknownAfter,
    remainingManualReviewCount: unknownAfter,
    unmatchedAssets,
  });

  await fs.writeFile(REPORT_OUTPUT_PATH, `\ufeff${report}`, "utf8");

  console.log(`Total records: ${nextAssets.length}`);
  console.log(`Mapping rules: ${validRules.length}`);
  console.log(`Matched records: ${hitRecords.length}`);
  console.log(`unknown_model before: ${unknownBefore}`);
  console.log(`unknown_model after: ${unknownAfter}`);
  console.log(`Corrected unknown_model: ${unknownBefore - unknownAfter}`);
  console.log(`Updated data: ${ASSET_OUTPUT_PATH}`);
  console.log(`Updated public data: ${PUBLIC_OUTPUT_PATH}`);
  console.log(`Report output: ${REPORT_OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("applyProductModelMapping.js failed.");
  console.error(error);
  process.exitCode = 1;
});
