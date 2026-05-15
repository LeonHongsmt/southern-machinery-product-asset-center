const fs = require("node:fs/promises");
const path = require("node:path");

const ASSET_INPUT_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const RULE_INPUT_PATH = path.resolve(
  __dirname,
  "../../data/asset_visibility_rules.json"
);
const ASSET_OUTPUT_PATH = path.resolve(__dirname, "../../data/product_assets.json");
const PUBLIC_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../public/data/product_assets.json"
);
const REPORT_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../data/asset_visibility_report.md"
);

const VISIBILITY_PRIORITY = {
  public: 0,
  internal_review: 1,
  hidden: 2,
};

const SUPPORTED_MATCH_TYPES = new Set([
  "file_name_contains",
  "source_url_contains",
  "product_name_contains",
  "category_equals",
  "file_type_equals",
  "exact_file_name",
]);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidRule(rule) {
  return (
    rule &&
    typeof rule === "object" &&
    typeof rule.rule_id === "string" &&
    rule.rule_id.trim().length > 0 &&
    SUPPORTED_MATCH_TYPES.has(rule.match_type) &&
    typeof rule.match_value === "string" &&
    rule.match_value.trim().length > 0 &&
    ["public", "internal_review", "hidden"].includes(rule.visibility) &&
    typeof rule.reason === "string" &&
    rule.reason.trim().length > 0
  );
}

function matchesRule(asset, rule) {
  const target = normalizeText(rule.match_value);

  if (rule.match_type === "file_name_contains") {
    return normalizeText(asset.file_name).includes(target);
  }

  if (rule.match_type === "source_url_contains") {
    return normalizeText(asset.source_url).includes(target);
  }

  if (rule.match_type === "product_name_contains") {
    return normalizeText(asset.product_name).includes(target);
  }

  if (rule.match_type === "category_equals") {
    return normalizeText(asset.category) === target;
  }

  if (rule.match_type === "file_type_equals") {
    return normalizeText(asset.file_type) === target;
  }

  if (rule.match_type === "exact_file_name") {
    return normalizeText(asset.file_name) === target;
  }

  return false;
}

function pickFinalVisibility(matchedRules) {
  if (!matchedRules.length) {
    return {
      visibility: "public",
      chosenRules: [],
    };
  }

  const sorted = matchedRules.slice().sort((a, b) => {
    const byPriority =
      VISIBILITY_PRIORITY[b.visibility] - VISIBILITY_PRIORITY[a.visibility];

    if (byPriority !== 0) {
      return byPriority;
    }

    return String(a.rule_id).localeCompare(String(b.rule_id));
  });

  const highest = VISIBILITY_PRIORITY[sorted[0].visibility];
  const chosenRules = sorted.filter(
    (rule) => VISIBILITY_PRIORITY[rule.visibility] === highest
  );

  return {
    visibility: sorted[0].visibility,
    chosenRules,
  };
}

function createVisibilityReason(visibility, chosenRules) {
  if (!chosenRules.length) {
    return "Default visibility: public";
  }

  const details = chosenRules.map((rule) => {
    return `${rule.rule_id} (${rule.reason})`;
  });

  return `${visibility}: ${details.join("; ")}`;
}

function createReport(params) {
  const {
    generatedAt,
    totalAssets,
    ruleCount,
    counts,
    hitsByRule,
    hiddenAssets,
    internalReviewAssets,
  } = params;

  const ruleLines = Object.entries(hitsByRule).map(([ruleId, files]) => {
    const fileLines = files.length
      ? files.map((fileName) => `  - ${fileName}`).join("\n")
      : "  - 无";
    return `- ${ruleId}\n${fileLines}`;
  });

  const hiddenLines = hiddenAssets.length
    ? hiddenAssets.map((asset) => {
        return `- ${asset.file_name} | ${asset.category} | ${asset.visibility_reason}`;
      })
    : ["- 无"];

  const reviewLines = internalReviewAssets.length
    ? internalReviewAssets.map((asset) => {
        return `- ${asset.file_name} | ${asset.category} | ${asset.visibility_reason}`;
      })
    : ["- 无"];

  return [
    "# Asset Visibility Report",
    "",
    `执行时间：${generatedAt}`,
    "",
    "## 汇总",
    "",
    `- 规则数量：${ruleCount}`,
    `- 总资产数量：${totalAssets}`,
    `- public 数量：${counts.public}`,
    `- internal_review 数量：${counts.internal_review}`,
    `- hidden 数量：${counts.hidden}`,
    `- 命中规则数量：${Object.values(hitsByRule).reduce((sum, files) => sum + files.length, 0)}`,
    "",
    "## 每条规则命中的文件",
    "",
    ...ruleLines,
    "",
    "## Hidden 文件列表",
    "",
    ...hiddenLines,
    "",
    "## Internal Review 文件列表",
    "",
    ...reviewLines,
    "",
    "## 下一步建议",
    "",
    "- 建议下一步修改前端，让 visibility=hidden 的记录默认不显示。",
    "- 对 visibility=internal_review 的记录，可以先保留在 JSON 中，但在前端增加内部复核标识或默认过滤。",
    "- 规则稳定后，可以把 visibility 纳入后续的数据整理和人工复核工作流。",
    "",
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const [assetRaw, ruleRaw] = await Promise.all([
    fs.readFile(ASSET_INPUT_PATH, "utf8"),
    fs.readFile(RULE_INPUT_PATH, "utf8"),
  ]);

  const assets = JSON.parse(assetRaw);
  const rules = JSON.parse(ruleRaw);

  if (!Array.isArray(assets)) {
    throw new Error("data/product_assets.json must be an array.");
  }

  if (!Array.isArray(rules)) {
    throw new Error("data/asset_visibility_rules.json must be an array.");
  }

  const validRules = rules.filter(isValidRule);
  const hitsByRule = {};
  for (const rule of validRules) {
    hitsByRule[rule.rule_id] = [];
  }

  const nextAssets = assets.map((asset) => {
    const matchedRules = validRules.filter((rule) => matchesRule(asset, rule));
    for (const rule of matchedRules) {
      hitsByRule[rule.rule_id].push(asset.file_name);
    }

    const { visibility, chosenRules } = pickFinalVisibility(matchedRules);

    return {
      ...asset,
      visibility,
      visibility_reason: createVisibilityReason(visibility, chosenRules),
    };
  });

  const counts = nextAssets.reduce(
    (accumulator, asset) => {
      const key = ["public", "internal_review", "hidden"].includes(asset.visibility)
        ? asset.visibility
        : "public";
      accumulator[key] += 1;
      return accumulator;
    },
    {
      public: 0,
      internal_review: 0,
      hidden: 0,
    }
  );

  const hiddenAssets = nextAssets.filter((asset) => asset.visibility === "hidden");
  const internalReviewAssets = nextAssets.filter(
    (asset) => asset.visibility === "internal_review"
  );
  const outputJson = `${JSON.stringify(nextAssets, null, 2)}\n`;

  await Promise.all([
    fs.writeFile(ASSET_OUTPUT_PATH, outputJson, "utf8"),
    fs.writeFile(PUBLIC_OUTPUT_PATH, outputJson, "utf8"),
  ]);

  const report = createReport({
    generatedAt,
    totalAssets: nextAssets.length,
    ruleCount: validRules.length,
    counts,
    hitsByRule,
    hiddenAssets,
    internalReviewAssets,
  });

  await fs.writeFile(REPORT_OUTPUT_PATH, `\ufeff${report}`, "utf8");

  console.log(`Rule count: ${validRules.length}`);
  console.log(`Total assets: ${nextAssets.length}`);
  console.log(`public count: ${counts.public}`);
  console.log(`internal_review count: ${counts.internal_review}`);
  console.log(`hidden count: ${counts.hidden}`);
  console.log(`Updated data: ${ASSET_OUTPUT_PATH}`);
  console.log(`Updated public data: ${PUBLIC_OUTPUT_PATH}`);
  console.log(`Report output: ${REPORT_OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("applyAssetVisibilityRules.js failed.");
  console.error(error);
  process.exitCode = 1;
});
