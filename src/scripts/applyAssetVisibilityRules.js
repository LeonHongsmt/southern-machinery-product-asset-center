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

function getRulePriority(rule) {
  const value = Number(rule?.priority);
  return Number.isFinite(value) ? value : 0;
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
    const byRulePriority = getRulePriority(b) - getRulePriority(a);
    if (byRulePriority !== 0) {
      return byRulePriority;
    }

    const byVisibility =
      VISIBILITY_PRIORITY[b.visibility] - VISIBILITY_PRIORITY[a.visibility];
    if (byVisibility !== 0) {
      return byVisibility;
    }

    return String(a.rule_id).localeCompare(String(b.rule_id));
  });

  const highestRulePriority = getRulePriority(sorted[0]);
  const topRules = sorted.filter(
    (rule) => getRulePriority(rule) === highestRulePriority
  );
  const chosenVisibility = topRules.slice().sort((a, b) => {
    const byVisibility =
      VISIBILITY_PRIORITY[b.visibility] - VISIBILITY_PRIORITY[a.visibility];
    if (byVisibility !== 0) {
      return byVisibility;
    }

    return String(a.rule_id).localeCompare(String(b.rule_id));
  })[0].visibility;

  const chosenRules = topRules.filter((rule) => rule.visibility === chosenVisibility);

  return {
    visibility: chosenVisibility,
    chosenRules,
  };
}

function createVisibilityReason(visibility, chosenRules) {
  if (!chosenRules.length) {
    return "Default visibility: public";
  }

  const details = chosenRules.map((rule) => {
    return `${rule.rule_id} [priority=${getRulePriority(rule)}] (${rule.reason})`;
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

  const ruleLines = Object.entries(hitsByRule).map(([ruleId, assets]) => {
    if (!assets.length) {
      return `- ${ruleId}\n  - None`;
    }

    return `- ${ruleId}\n${assets
      .map((item) => `  - ${item.file_name} | ${item.visibility}`)
      .join("\n")}`;
  });

  const hiddenLines = hiddenAssets.length
    ? hiddenAssets.map((asset) => {
        return `- ${asset.file_name} | ${asset.category} | ${asset.visibility_reason}`;
      })
    : ["- None"];

  const reviewLines = internalReviewAssets.length
    ? internalReviewAssets.map((asset) => {
        return `- ${asset.file_name} | ${asset.category} | ${asset.visibility_reason}`;
      })
    : ["- None"];

  return [
    "# Asset Visibility Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Rule count: ${ruleCount}`,
    `- Total asset count: ${totalAssets}`,
    `- public count: ${counts.public}`,
    `- internal_review count: ${counts.internal_review}`,
    `- hidden count: ${counts.hidden}`,
    `- Matched rule hits: ${Object.values(hitsByRule).reduce((sum, assets) => sum + assets.length, 0)}`,
    "",
    "## Rule hits",
    "",
    ...ruleLines,
    "",
    "## Hidden assets",
    "",
    ...hiddenLines,
    "",
    "## Internal review assets",
    "",
    ...reviewLines,
    "",
    "## Notes",
    "",
    "- Specific exact-file rules can override broad file_type or category rules through rule priority.",
    "- Audio assets remain hidden by default unless a more specific review rule is intentionally applied.",
    "- Keep hidden assets in the dataset; front-end filtering should decide whether to show them.",
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
    const { visibility, chosenRules } = pickFinalVisibility(matchedRules);

    for (const rule of matchedRules) {
      hitsByRule[rule.rule_id].push({
        file_name: asset.file_name,
        visibility: rule.visibility,
      });
    }

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

  await fs.writeFile(REPORT_OUTPUT_PATH, `\uFEFF${report}\n`, "utf8");

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
