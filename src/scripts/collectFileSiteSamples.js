const fs = require("node:fs/promises");
const path = require("node:path");

const { validateProductAsset } = require("../schema/productAssetSchema.js");

const API_URL = "https://file.autoinsertion.com/api/filelist";
const PUBLIC_BASE_URL = "https://file.autoinsertion.com/public";
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../../data/file_site_samples.json");
const OUTPUT_REPORT_PATH = path.resolve(__dirname, "../../data/file_site_samples_report.md");

const MAX_DIRECTORY_REQUESTS = 5;
const MAX_TOTAL_FILES = 20;
const MAX_FILES_PER_DIRECTORY = 5;

const DIRECTORY_PRIORITY = [
  "southern machinery product",
  "southern machinery manual",
  "smthelp poster",
  "smthelp machine presentation",
  "product landing page",
];

const FILE_TYPE_COUNTS = {
  pdf: 0,
  image: 0,
  manual: 0,
  document: 0,
  other: 0,
};

function ensureFetch() {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Current Node.js runtime does not support built-in fetch.");
  }
}

function encodeFpathForPublicUrl(fpath) {
  return fpath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPublicUrl(fpath) {
  return `${PUBLIC_BASE_URL}${encodeFpathForPublicUrl(fpath)}`;
}

function getExtension(fileName) {
  const lowerName = String(fileName || "").toLowerCase();
  const lastDot = lowerName.lastIndexOf(".");
  return lastDot >= 0 ? lowerName.slice(lastDot + 1) : "";
}

function detectFileType(fileName) {
  const lowerName = String(fileName || "").toLowerCase();
  const ext = getExtension(fileName);

  const imageExts = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp"]);
  const documentExts = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "html", "htm", "zip", "rar", "7z"]);

  if (imageExts.has(ext)) {
    return "image";
  }

  if (
    lowerName.includes("manual") ||
    lowerName.includes("guide") ||
    lowerName.includes("instruction") ||
    lowerName.includes("spec") ||
    lowerName.includes("datasheet") ||
    lowerName.includes("说明") ||
    lowerName.includes("手册")
  ) {
    return ext === "pdf" || documentExts.has(ext) ? "manual" : "manual";
  }

  if (ext === "pdf") {
    return "pdf";
  }

  if (documentExts.has(ext)) {
    return "document";
  }

  return "other";
}

function extractProductModel(input) {
  const normalized = String(input || "")
    .replace(/%20/g, " ")
    .replace(/[_/]+/g, " ")
    .toUpperCase();
  const patterns = [
    /(?:^|[^A-Z0-9])(SME-\d{2,5}[A-Z]{0,3})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(SIS\d{3,5}[A-Z]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(SP-\d{2,5}[A-Z]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(S-\d{2,5}[A-Z]{0,3})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(S\d{3,5}[A-Z]{0,3})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(ADL\d{2,5}[A-Z]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])([A-Z]{2,5}\d{2,5}[A-Z]{0,2})(?=$|[^A-Z0-9])/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return "unknown_model";
}

function toCategory(fpath) {
  const segments = String(fpath || "")
    .split("/")
    .filter(Boolean);

  if (segments.length <= 1) {
    return "root";
  }

  return segments[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "uncategorized";
}

function toProductName(fileName, productModel) {
  const raw = String(fileName || "");
  const withoutExt = raw.replace(/\.[^.]+$/, "");
  let cleaned = withoutExt;

  if (productModel && productModel !== "unknown_model") {
    const escaped = productModel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(escaped, "ig"), "");
  }

  cleaned = cleaned.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  return cleaned || withoutExt || raw || "Unnamed asset";
}

function normalizeTimestamp(rawTime, fallbackIso) {
  if (!rawTime || typeof rawTime !== "string") {
    return fallbackIso;
  }

  const candidate = rawTime.includes("T")
    ? rawTime
    : `${rawTime.replace(" ", "T")}Z`;
  const parsed = new Date(candidate);

  if (Number.isNaN(parsed.getTime())) {
    return fallbackIso;
  }

  return parsed.toISOString();
}

function buildAssetRecord(item, requestedPath, generatedAt) {
  const fileName = item.name || path.basename(item.fpath || "");
  const fileType = detectFileType(fileName);
  const productModel = extractProductModel(`${fileName} ${item.fpath || ""}`);
  const publicUrl = buildPublicUrl(item.fpath || `/${fileName}`);
  const description = "To be confirmed from official document";
  const normalizedTime = normalizeTimestamp(item.mtime, generatedAt);

  return {
    product_model: productModel,
    product_name: toProductName(fileName, productModel),
    category: toCategory(item.fpath || requestedPath),
    file_name: fileName,
    file_type: fileType,
    pdf_links: fileType === "pdf" ? [publicUrl] : [],
    image_links: fileType === "image" ? [publicUrl] : [],
    manual_links: fileType === "manual" ? [publicUrl] : [],
    source_url: publicUrl,
    description,
    remarks:
      productModel === "unknown_model"
        ? `Sample collected from public directory ${requestedPath}; product model not confidently detected.`
        : `Sample collected from public directory ${requestedPath}.`,
    created_at: normalizedTime,
    updated_at: normalizedTime,
    // 以下字段保留接口原始元信息，便于后续人工核对。
    name: item.name || "",
    path: requestedPath,
    fpath: item.fpath || "",
    size: item.size ?? null,
    mtime: item.mtime || "",
    ext: item.ext || getExtension(fileName),
    ftype: item.ftype || "file",
  };
}

function sortFolders(items) {
  return items.slice().sort((a, b) => {
    const aName = String(a.name || "").toLowerCase();
    const bName = String(b.name || "").toLowerCase();
    const aIndex = DIRECTORY_PRIORITY.findIndex((keyword) => aName.includes(keyword));
    const bIndex = DIRECTORY_PRIORITY.findIndex((keyword) => bName.includes(keyword));
    const normalizedA = aIndex === -1 ? DIRECTORY_PRIORITY.length : aIndex;
    const normalizedB = bIndex === -1 ? DIRECTORY_PRIORITY.length : bIndex;
    return normalizedA - normalizedB;
  });
}

async function fetchDirectory(directoryPath) {
  const formData = new FormData();
  formData.set("path", directoryPath);
  formData.set("type", "public");

  const response = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 200)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`Invalid JSON response: ${error.message}`);
  }

  const items = Array.isArray(parsed.data)
    ? parsed.data
    : Array.isArray(parsed.content)
      ? parsed.content
      : Array.isArray(parsed.data && parsed.data.content)
        ? parsed.data.content
        : [];

  return {
    status: response.status,
    items,
    rawCode: parsed.code,
  };
}

function createReport(params) {
  const {
    generatedAt,
    requestedDirectories,
    assets,
    typeCounts,
    unknownModelCount,
    recognizedModelCount,
    failures,
  } = params;

  const directoryLines = requestedDirectories.map(
    (entry) => `- ${entry.path}：HTTP ${entry.status}，返回 ${entry.itemCount} 个条目`
  );

  const failureLines = failures.length
    ? failures.map((entry) => `- ${entry.path}：${entry.error}`)
    : ["- 无"];

  return [
    "# File Site Samples Report",
    "",
    `验证时间：${generatedAt}`,
    "",
    "## 请求目录",
    "",
    ...directoryLines,
    "",
    "## 采集结果",
    "",
    `- 成功采集条数：${assets.length}`,
    `- 请求目录数：${requestedDirectories.length}`,
    "",
    "## 文件类型统计",
    "",
    `- pdf：${typeCounts.pdf}`,
    `- image：${typeCounts.image}`,
    `- manual：${typeCounts.manual}`,
    `- document：${typeCounts.document}`,
    `- other：${typeCounts.other}`,
    "",
    "## 型号识别情况",
    "",
    `- 已识别型号条数：${recognizedModelCount}`,
    `- unknown_model 条数：${unknownModelCount}`,
    "",
    "## 失败或异常情况",
    "",
    ...failureLines,
    "",
    "## 下一步建议",
    "",
    "- 可以先把这批真实样本人工复核，确认 product_model 识别规则是否足够稳定。",
    "- 如果 PDF、图片、manual 的分类结果符合预期，再扩大到更多公开目录，但仍保持限量采样。",
    "- 样本确认稳定后，再整理为正式 product_assets.json，而不是直接进入完整全站抓取。",
    "",
  ].join("\n");
}

async function main() {
  ensureFetch();

  const generatedAt = new Date().toISOString();
  const requestedDirectories = [];
  const failures = [];
  const assets = [];
  const seenFpaths = new Set();

  const queue = ["/"];
  const queued = new Set(queue);

  while (
    queue.length > 0 &&
    requestedDirectories.length < MAX_DIRECTORY_REQUESTS &&
    assets.length < MAX_TOTAL_FILES
  ) {
    const currentPath = queue.shift();

    try {
      const result = await fetchDirectory(currentPath);
      requestedDirectories.push({
        path: currentPath,
        status: result.status,
        itemCount: result.items.length,
      });

      const folders = sortFolders(
        result.items.filter((item) => item && item.ftype === "folder")
      );

      for (const folder of folders) {
        if (requestedDirectories.length + queue.length >= MAX_DIRECTORY_REQUESTS) {
          break;
        }
        const nextPath = folder.fpath || `${currentPath.replace(/\/$/, "")}/${folder.name}`;
        if (!queued.has(nextPath)) {
          queue.push(nextPath);
          queued.add(nextPath);
        }
      }

      const files = result.items.filter((item) => item && item.ftype === "file");
      let localCount = 0;

      for (const item of files) {
        if (assets.length >= MAX_TOTAL_FILES || localCount >= MAX_FILES_PER_DIRECTORY) {
          break;
        }
        if (!item.fpath || seenFpaths.has(item.fpath)) {
          continue;
        }

        const asset = buildAssetRecord(item, currentPath, generatedAt);
        const validation = validateProductAsset(asset);

        if (!validation.valid) {
          failures.push({
            path: item.fpath || currentPath,
            error: `Schema validation failed: ${validation.errors.join("; ")}`,
          });
          continue;
        }

        assets.push(asset);
        seenFpaths.add(item.fpath);
        FILE_TYPE_COUNTS[asset.file_type] += 1;
        localCount += 1;
      }
    } catch (error) {
      failures.push({
        path: currentPath,
        error: error.message,
      });
    }
  }

  const unknownModelCount = assets.filter(
    (asset) => asset.product_model === "unknown_model"
  ).length;
  const recognizedModelCount = assets.length - unknownModelCount;

  await fs.writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(assets, null, 2)}\n`, "utf8");

  const report = createReport({
    generatedAt,
    requestedDirectories,
    assets,
    typeCounts: FILE_TYPE_COUNTS,
    unknownModelCount,
    recognizedModelCount,
    failures,
  });
  await fs.writeFile(OUTPUT_REPORT_PATH, report, "utf8");

  console.log(`Requested directories: ${requestedDirectories.length}`);
  console.log(`Collected file records: ${assets.length}`);
  console.log(`pdf count: ${FILE_TYPE_COUNTS.pdf}`);
  console.log(`image count: ${FILE_TYPE_COUNTS.image}`);
  console.log(`document/manual count: ${FILE_TYPE_COUNTS.document + FILE_TYPE_COUNTS.manual}`);
  console.log(`unknown_model count: ${unknownModelCount}`);
  console.log(`JSON output: ${OUTPUT_JSON_PATH}`);
  console.log(`Report output: ${OUTPUT_REPORT_PATH}`);
}

main().catch((error) => {
  console.error("collectFileSiteSamples.js failed.");
  console.error(error);
  process.exitCode = 1;
});
