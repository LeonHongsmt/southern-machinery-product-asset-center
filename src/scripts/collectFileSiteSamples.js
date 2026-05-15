const fs = require("node:fs/promises");
const path = require("node:path");

const { validateProductAsset } = require("../schema/productAssetSchema.js");

const API_URL = "https://file.autoinsertion.com/api/filelist";
const PUBLIC_BASE_URL = "https://file.autoinsertion.com/public";
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../../data/file_site_samples.json");
const OUTPUT_REPORT_PATH = path.resolve(__dirname, "../../data/file_site_samples_report.md");

const MAX_FILES = 100;
const MAX_DIRECTORY_REQUESTS = 20;
const MAX_DIRECTORY_DEPTH = 3;
const MAX_FILES_PER_DIRECTORY = 15;
const REQUEST_DELAY_MS = 200;

const DIRECTORY_PRIORITY = [
  "southern machinery product",
  "southern machinery manual",
  "smthelp machine presentation",
  "smthelp poster",
  "product landing page",
  "smt machine 3d drawing in html",
  "smt machine 3d drawing",
  "smt audio",
];

const FILE_TYPE_PRIORITY = {
  pdf: 0,
  image: 1,
  manual: 2,
  audio: 3,
  document: 4,
  other: 5,
};

function ensureFetch() {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Current Node.js runtime does not support built-in fetch.");
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createTypeCounts() {
  return {
    pdf: 0,
    image: 0,
    manual: 0,
    audio: 0,
    document: 0,
    other: 0,
  };
}

function normalizeDirectoryPath(inputPath) {
  const normalized = String(inputPath || "/").trim().replace(/\\/g, "/");

  if (!normalized || normalized === "/") {
    return "/";
  }

  return `/${normalized.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function getPathDepth(directoryPath) {
  if (directoryPath === "/") {
    return 0;
  }

  return directoryPath.split("/").filter(Boolean).length;
}

function encodeFpathForPublicUrl(fpath) {
  return String(fpath || "")
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

function extractProductModel(input) {
  const normalized = String(input || "")
    .replace(/%20/g, " ")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
  const patterns = [
    /(?:^|[^A-Z0-9])(SME-\d{2,5}[A-Z0-9]{0,4})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(SIS\d{3,5}[A-Z0-9]{0,3})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(ADL\d{2,5}[A-Z0-9]{0,3})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(S-[A-Z]{0,3}\d{2,5}[A-Z0-9]{0,4})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(ST[PFRJL]\d{4}[A-Z0-9]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(SSPC\d{3,5}[A-Z0-9]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(SCN\d{3,5}[A-Z0-9]{0,2})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])(S\d{3,5}[A-Z0-9-]{0,4})(?=$|[^A-Z0-9])/,
    /(?:^|[^A-Z0-9])([A-Z]{2,5}\d{2,5}[A-Z0-9-]{0,3})(?=$|[^A-Z0-9])/,
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

  return (
    segments[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "uncategorized"
  );
}

function toProductName(fileName, productModel) {
  const raw = String(fileName || "");
  const withoutExt = raw.replace(/\.[^.]+$/, "");
  let cleaned = withoutExt;

  if (productModel && productModel !== "unknown_model") {
    const escaped = productModel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(escaped, "ig"), "");
  }

  cleaned = cleaned
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  const normalizedTime = normalizeTimestamp(item.mtime, generatedAt);
  const isManualLike =
    fileType === "manual" || fileType === "document" || fileType === "audio";

  return {
    product_model: productModel,
    product_name: toProductName(fileName, productModel),
    category: toCategory(item.fpath || requestedPath),
    file_name: fileName,
    file_type: fileType,
    pdf_links: fileType === "pdf" ? [publicUrl] : [],
    image_links: fileType === "image" ? [publicUrl] : [],
    manual_links: isManualLike ? [publicUrl] : [],
    source_url: publicUrl,
    description: "To be confirmed from official document",
    remarks:
      productModel === "unknown_model"
        ? `Sample collected from public directory ${requestedPath}; product model not confidently detected.`
        : `Sample collected from public directory ${requestedPath}.`,
    created_at: normalizedTime,
    updated_at: normalizedTime,
    // 保留接口原始字段，便于后续人工复核。
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

    if (normalizedA !== normalizedB) {
      return normalizedA - normalizedB;
    }

    return aName.localeCompare(bName);
  });
}

function sortFiles(items) {
  return items.slice().sort((a, b) => {
    const aModel = extractProductModel(`${a.name || ""} ${a.fpath || ""}`);
    const bModel = extractProductModel(`${b.name || ""} ${b.fpath || ""}`);
    const aKnown = aModel === "unknown_model" ? 1 : 0;
    const bKnown = bModel === "unknown_model" ? 1 : 0;

    if (aKnown !== bKnown) {
      return aKnown - bKnown;
    }

    const aType = detectFileType(a.name || "");
    const bType = detectFileType(b.name || "");
    const aTypeRank = FILE_TYPE_PRIORITY[aType] ?? 99;
    const bTypeRank = FILE_TYPE_PRIORITY[bType] ?? 99;

    if (aTypeRank !== bTypeRank) {
      return aTypeRank - bTypeRank;
    }

    return String(a.name || "").localeCompare(String(b.name || ""));
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
    skippedDirectories,
    assets,
    typeCounts,
    unknownModelCount,
    invalidRecords,
    failures,
  } = params;

  const requestedLines = requestedDirectories.length
    ? requestedDirectories.map((entry) => {
        return `- ${entry.path} | HTTP ${entry.status} | files ${entry.fileCount} | folders ${entry.folderCount} | items ${entry.itemCount}`;
      })
    : ["- 无"];

  const invalidLines = invalidRecords.length
    ? invalidRecords.map((entry) => {
        return `- ${entry.path}: ${entry.errors.join("; ")}`;
      })
    : ["- 无"];

  const skippedLines = [...failures, ...skippedDirectories].length
    ? [...failures, ...skippedDirectories].map((entry) => {
        return `- ${entry.path}: ${entry.error || entry.reason}`;
      })
    : ["- 无"];

  return [
    "# File Site Samples Report",
    "",
    `生成时间：${generatedAt}`,
    `目标样本数量：${MAX_FILES}`,
    "",
    "## 目录请求概况",
    "",
    `- 实际请求目录数：${requestedDirectories.length}`,
    `- 实际采集文件数：${assets.length}`,
    `- 校验失败数：${invalidRecords.length}`,
    "",
    "## 已请求目录",
    "",
    ...requestedLines,
    "",
    "## 文件类型统计",
    "",
    `- PDF 数量：${typeCounts.pdf}`,
    `- Image 数量：${typeCounts.image}`,
    `- Manual 数量：${typeCounts.manual}`,
    `- Audio 数量：${typeCounts.audio}`,
    `- Document 数量：${typeCounts.document}`,
    `- Other 数量：${typeCounts.other}`,
    "",
    "## 型号识别情况",
    "",
    `- 已识别 product_model 数量：${assets.length - unknownModelCount}`,
    `- unknown_model 数量：${unknownModelCount}`,
    "",
    "## 校验失败记录",
    "",
    ...invalidLines,
    "",
    "## 请求失败或跳过的目录",
    "",
    ...skippedLines,
    "",
    "## 下一步建议",
    "",
    "- 先对 unknown_model 和被聚合概率较高的样本做人工复核，确认产品型号识别规则是否需要补充。",
    "- 当前仍属于扩大公开样本验证，不建议直接切换为全站递归抓取。",
    "- 当样本覆盖度稳定后，优先建立产品型号人工修正表，再继续扩样本。",
    "",
  ].join("\n");
}

async function collectDirectoryData() {
  const requestedDirectories = [];
  const skippedDirectories = [];
  const failures = [];
  const directories = [];

  const queue = ["/"];
  const queued = new Set(queue);

  while (queue.length > 0 && requestedDirectories.length < MAX_DIRECTORY_REQUESTS) {
    const currentPath = normalizeDirectoryPath(queue.shift());

    if (requestedDirectories.length > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    try {
      const result = await fetchDirectory(currentPath);
      const folders = sortFolders(
        result.items.filter((item) => item && item.ftype === "folder")
      );
      const files = sortFiles(
        result.items.filter((item) => item && item.ftype === "file")
      );

      requestedDirectories.push({
        path: currentPath,
        status: result.status,
        itemCount: result.items.length,
        fileCount: files.length,
        folderCount: folders.length,
      });

      directories.push({
        path: currentPath,
        files,
      });

      if (getPathDepth(currentPath) >= MAX_DIRECTORY_DEPTH) {
        if (folders.length > 0) {
          skippedDirectories.push({
            path: currentPath,
            reason: `Skipped deeper folders because MAX_DIRECTORY_DEPTH=${MAX_DIRECTORY_DEPTH}`,
          });
        }
        continue;
      }

      for (const folder of folders) {
        const nextPath = normalizeDirectoryPath(
          folder.fpath || `${currentPath}/${folder.name}`
        );

        if (queued.has(nextPath)) {
          continue;
        }

        queue.push(nextPath);
        queued.add(nextPath);
      }
    } catch (error) {
      failures.push({
        path: currentPath,
        error: error.message,
      });
    }
  }

  for (const pathToSkip of queue) {
    skippedDirectories.push({
      path: pathToSkip,
      reason: `Skipped because MAX_DIRECTORY_REQUESTS=${MAX_DIRECTORY_REQUESTS} was reached`,
    });
  }

  return {
    requestedDirectories,
    skippedDirectories,
    failures,
    directories,
  };
}

function sampleAssetsFromDirectories(directories, generatedAt) {
  const assets = [];
  const invalidRecords = [];
  const typeCounts = createTypeCounts();
  const seenFpaths = new Set();

  const workingDirectories = directories.map((directory) => {
    return {
      path: directory.path,
      files: directory.files,
      index: 0,
      selected: 0,
    };
  });

  while (assets.length < MAX_FILES) {
    let progressed = false;

    for (const directory of workingDirectories) {
      if (assets.length >= MAX_FILES) {
        break;
      }

      if (directory.selected >= MAX_FILES_PER_DIRECTORY) {
        continue;
      }

      while (directory.index < directory.files.length) {
        const item = directory.files[directory.index];
        directory.index += 1;

        if (!item || !item.fpath || seenFpaths.has(item.fpath)) {
          continue;
        }

        const asset = buildAssetRecord(item, directory.path, generatedAt);
        const validation = validateProductAsset(asset);

        if (!validation.valid) {
          invalidRecords.push({
            path: item.fpath || directory.path,
            errors: validation.errors,
          });
          continue;
        }

        assets.push(asset);
        seenFpaths.add(item.fpath);
        typeCounts[asset.file_type] = (typeCounts[asset.file_type] || 0) + 1;
        directory.selected += 1;
        progressed = true;
        break;
      }
    }

    if (!progressed) {
      break;
    }
  }

  return {
    assets,
    invalidRecords,
    typeCounts,
  };
}

async function main() {
  ensureFetch();

  const generatedAt = new Date().toISOString();
  const {
    requestedDirectories,
    skippedDirectories,
    failures,
    directories,
  } = await collectDirectoryData();
  const {
    assets,
    invalidRecords,
    typeCounts,
  } = sampleAssetsFromDirectories(directories, generatedAt);

  const unknownModelCount = assets.filter(
    (asset) => asset.product_model === "unknown_model"
  ).length;

  await fs.writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(assets, null, 2)}\n`, "utf8");

  const report = createReport({
    generatedAt,
    requestedDirectories,
    skippedDirectories,
    assets,
    typeCounts,
    unknownModelCount,
    invalidRecords,
    failures,
  });
  await fs.writeFile(OUTPUT_REPORT_PATH, `\ufeff${report}`, "utf8");

  console.log(`Requested directories: ${requestedDirectories.length}`);
  console.log(`Collected file records: ${assets.length}`);
  console.log(`pdf count: ${typeCounts.pdf}`);
  console.log(`image count: ${typeCounts.image}`);
  console.log(
    `document/manual/audio count: ${
      typeCounts.document + typeCounts.manual + typeCounts.audio
    }`
  );
  console.log(`other count: ${typeCounts.other}`);
  console.log(`unknown_model count: ${unknownModelCount}`);
  console.log(`validation failure count: ${invalidRecords.length}`);
  console.log(`JSON output: ${OUTPUT_JSON_PATH}`);
  console.log(`Report output: ${OUTPUT_REPORT_PATH}`);
}

main().catch((error) => {
  console.error("collectFileSiteSamples.js failed.");
  console.error(error);
  process.exitCode = 1;
});
