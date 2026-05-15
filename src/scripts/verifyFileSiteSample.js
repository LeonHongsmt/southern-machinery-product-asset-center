const fs = require("node:fs/promises");
const path = require("node:path");
const https = require("node:https");

const ENTRY_URL = "https://file.autoinsertion.com/#/";
const API_URL = "https://file.autoinsertion.com/api/filelist";
const REPORT_PATH = path.resolve(__dirname, "../../data/file_site_sample_report.md");

function createHttpsRequester() {
  return function requestWithHttps(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestUrl = new URL(url);
      const req = https.request(
        {
          method: options.method || "GET",
          hostname: requestUrl.hostname,
          path: `${requestUrl.pathname}${requestUrl.search}`,
          headers: options.headers || {},
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const bodyBuffer = Buffer.concat(chunks);
            const bodyText = bodyBuffer.toString("utf8");
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode || 0,
              headers: {
                get(name) {
                  const value = res.headers[String(name).toLowerCase()];
                  return Array.isArray(value) ? value.join(", ") : value || null;
                },
              },
              text: async () => bodyText,
              json: async () => JSON.parse(bodyText),
            });
          });
        }
      );

      req.on("error", reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  };
}

async function request(url, options = {}) {
  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch(url, options);
  }

  const fallbackRequest = createHttpsRequester();
  return fallbackRequest(url, options);
}

function detectHtmlClues(html) {
  const lower = html.toLowerCase();
  return {
    js: lower.includes(".js"),
    css: lower.includes(".css"),
    pdf: lower.includes(".pdf"),
    img: lower.includes("<img") || lower.includes("image"),
    api: lower.includes("/api/"),
    assets: lower.includes("assets"),
    static: lower.includes("static"),
  };
}

function buildClueSummary(clues) {
  return Object.entries(clues)
    .filter(([, hit]) => hit)
    .map(([key]) => key);
}

async function checkEntryPage() {
  const response = await request(ENTRY_URL);
  const html = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const clues = detectHtmlClues(html);

  return {
    url: ENTRY_URL,
    status: response.status,
    contentType,
    htmlLength: html.length,
    clues,
  };
}

async function checkRootFileList() {
  const body = JSON.stringify({
    path: "/",
    type: "public",
  });

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body,
    });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      parseError = error.message;
    }

    const listLength =
      parsed && Array.isArray(parsed.data && parsed.data.content)
        ? parsed.data.content.length
        : parsed && Array.isArray(parsed.content)
          ? parsed.content.length
          : null;

    return {
      url: API_URL,
      status: response.status,
      contentType,
      accessible: response.status >= 200 && response.status < 300,
      parseError,
      listLength,
      preview:
        rawText.length > 300 ? `${rawText.slice(0, 300)}...` : rawText,
    };
  } catch (error) {
    return {
      url: API_URL,
      accessible: false,
      error: error.message,
    };
  }
}

function createReport(entryResult, apiResult, generatedAt) {
  const clueSummary = buildClueSummary(entryResult.clues);
  const apiFailureReason = apiResult.error || apiResult.parseError || "None";

  return [
    "# File Site Sample Verification Report",
    "",
    `生成时间：${generatedAt}`,
    "",
    "## 入口页面检查",
    "",
    `- 请求 URL：${entryResult.url}`,
    `- HTTP 状态码：${entryResult.status}`,
    `- content-type：${entryResult.contentType || "N/A"}`,
    `- 页面 HTML 长度：${entryResult.htmlLength}`,
    `- 检测到的资源线索：${clueSummary.length ? clueSummary.join(", ") : "None"}`,
    "",
    "## /api/filelist 检查",
    "",
    `- 请求 URL：${apiResult.url}`,
    `- 是否可访问：${apiResult.accessible ? "Yes" : "No"}`,
    `- HTTP 状态码：${apiResult.status ?? "N/A"}`,
    `- content-type：${apiResult.contentType || "N/A"}`,
    `- 根目录返回条目数：${apiResult.listLength ?? "Unknown"}`,
    `- 失败原因：${apiFailureReason}`,
    "",
    "## 原始响应预览",
    "",
    "```text",
    apiResult.preview || apiResult.error || "No preview available",
    "```",
    "",
    "## 说明",
    "",
    "- 本报告仅验证入口页面和公开根目录接口。",
    "- 本脚本不递归抓取目录，不批量下载文件，不执行完整爬虫流程。",
    "",
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const entryResult = await checkEntryPage();
  const apiResult = await checkRootFileList();
  const report = createReport(entryResult, apiResult, generatedAt);

  await fs.writeFile(REPORT_PATH, report, "utf8");

  console.log("File site sample verification completed.");
  console.log(`Entry page status: ${entryResult.status}`);
  console.log(
    `Detected clues: ${buildClueSummary(entryResult.clues).join(", ") || "None"}`
  );
  console.log(
    `/api/filelist accessible: ${apiResult.accessible ? "Yes" : "No"}`
  );
  if (!apiResult.accessible || apiResult.parseError) {
    console.log(`API note: ${apiResult.error || apiResult.parseError}`);
  }
  console.log(`Report written to: ${REPORT_PATH}`);
}

main().catch(async (error) => {
  const fallbackReport = [
    "# File Site Sample Verification Report",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "## 执行失败",
    "",
    `- 错误信息：${error.message}`,
    "",
    "## 说明",
    "",
    "- 本次脚本执行未完成，仅记录失败原因。",
    "- 请检查网络访问、Node.js 环境或目标站点可用性后重试。",
    "",
  ].join("\n");

  try {
    await fs.writeFile(REPORT_PATH, fallbackReport, "utf8");
  } catch {
    // 写失败时保持静默，直接输出控制台错误。
  }

  console.error("File site sample verification failed.");
  console.error(error);
  process.exitCode = 1;
});
