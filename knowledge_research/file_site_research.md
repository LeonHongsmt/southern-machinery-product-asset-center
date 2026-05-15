# file.autoinsertion.com 文件站结构研究

研究日期：2026-05-14  
目标站点：https://file.autoinsertion.com/#/

## 结论摘要

该站不是传统静态目录页，也不是服务端把文件列表直接渲染到 HTML 中的页面；它是一个前端渲染的 SPA 文件站。入口 HTML 只有 `#app` 容器和版本化前端资源，真实目录与文件列表通过接口加载。

公开目录可通过 `POST /api/filelist` 获取，公开文件可通过 `https://file.autoinsertion.com/public` 加文件的 `fpath` 拼出真实直链。抽样验证 PDF、PNG 均可直接访问，且响应头允许跨域读取与断点续传。私有目录需要登录 token，未登录请求 `type=private` 返回 `403 Permission denied!`。

## 站点类型判断

1. 入口页 `https://file.autoinsertion.com/#/` 返回的是 SPA 壳：
   - 页面标题为 `Southern Smart EMS`。
   - 主要脚本为 `/assets/default/index.20250915.js?v=20250915`。
   - 文件列表没有出现在 HTML 中。

2. 前端 bundle 显示站点使用文件站程序的接口加载数据：
   - 站点配置：`GET /api/get/appinfo`
   - 目录列表：`POST /api/filelist`
   - 单文件信息：`POST /api/get/fileinfo`
   - 分享信息：`POST /api/get/share_info`
   - 登录：`POST /api/user/login`
   - token 状态：`POST /api/token/status`

3. 当前公开站点配置里 `storage.public_domain` 和 `storage.private_domain` 为空。前端逻辑会回退为：
   - 公开文件域：`https://file.autoinsertion.com/public`
   - 私有文件域：`https://file.autoinsertion.com/private`

## 文件列表接口

公开目录列表可通过 `POST /api/filelist` 获取。实测请求字段为：

- `path`：目录路径，例如 `/`、`/Southern Machinery Product`、`/Southern Machinery Manual`
- `type`：`public` 或 `private`

公开根目录返回示例字段包括：

- `name`：文件或文件夹名
- `size`：大小，文件夹也有占位大小
- `mtime`：修改时间
- `ftype`：`folder` 或 `file`
- `fpath`：完整站内路径
- `ext`：扩展名
- `link`：外链字段，当前公开样本多为空
- `token`、`exp`：私有或临时访问可能使用，当前公开样本为空或 0
- `fid`：当前公开样本多为 0

公开根目录实测包含：

- `Southern Machinery Product`
- `SMThelp Poster`
- `SMThelp Machine Presentation`
- `SMT machine 3D Drawing in Html`
- `Product landing Page`
- `SMT Audio`
- `Southern Machinery Manual`
- `SMT machine 3D drawing`
- `tool_THT Knowledge Chatbots.html`

注意：使用 JSON 或表单时，若后端没有正确读取 `path`，可能回退返回根目录。实测 multipart/form-data 形式能稳定读取带空格的目录路径。

## 真实文件链接获取方式

前端的 `getFileViewDomain()` 逻辑可以概括为：

1. 取接口返回的 `fpath`。
2. 对路径做 URL 编码，但保留 `/` 作为路径分隔符。
3. 如果 `token` 和 `exp` 存在，则使用私有域并追加 `token`、`exp` 查询参数。
4. 如果没有 token，则使用公开域并追加随机参数防缓存。

公开文件真实链接规则：

- 基础形式：`https://file.autoinsertion.com/public` + 编码后的 `fpath`
- 前端通常会追加 `?random=0.xxx`
- 随机参数不是鉴权参数，主要用于避免缓存；下载时可保留也可省略，建议保留或用 HEAD 验证。

样例：

- PDF：`https://file.autoinsertion.com/public/Southern%20Machinery%20Product/SME-350MB_PCBA_Inline_Cleaning_Machine_Southern_Machinery_Final_Client_Ready_ROI_Enhanced.pdf?random=0.123`
- 图片：`https://file.autoinsertion.com/public/SMThelp%20Poster/S-350C.png?random=0.123`

抽样 HEAD 验证结果：

- PDF 返回 `200 OK`，`Content-Type: application/pdf`，支持 `Accept-Ranges: bytes`。
- PNG 返回 `200 OK`，`Content-Type: image/png`，支持 `Accept-Ranges: bytes`。
- 响应头包含 `Access-Control-Allow-Origin: *`，跨域读取限制较宽。

PDF 预览页面会使用站内 PDF.js：`/assets/pdfjs/web/viewer.html?file=...`。这只是预览壳，真实文件仍是 `file` 参数里的直链。

## 是否可以批量抓取全部文件

公开文件可以批量抓取。理由：

- `POST /api/filelist` 能列出任意公开目录的完整子项。
- 返回项明确区分 `folder` 与 `file`。
- 文件项包含完整 `fpath`，可以直接拼出 `/public` 直链。
- 当前样本没有分页字段，也没有发现公开目录列表需要验证码或登录。
- 公开文件直链支持 HEAD、GET 与 Range，适合断点续传和去重校验。

建议批量策略：

1. 从公开根目录 `/` 开始递归遍历。
2. 遇到 `ftype=folder` 继续请求 `POST /api/filelist`。
3. 遇到 `ftype=file` 保存接口元数据，并按 `/public + fpath` 生成直链。
4. 下载前用 HEAD 检查 `Content-Length`、`Content-Type`、`Last-Modified`。
5. 用 `fpath`、`size`、`mtime`、可选的 `md5` 做增量更新和去重。

不建议优先用浏览器自动化抓 DOM。SPA 页面只是接口的可视化包装，直接用接口更稳定、成本更低，也更容易恢复失败任务。

## 文件名没有产品型号时如何处理

站内文件名质量不一致，有些文件含型号，例如 `S7900`、`S-4000`、`SME5200`；也有一些只有泛称，例如 `Radial tape feeder.pdf`、`Belt feeder.pdf`、`nozzle cleaning machine.pdf`。

建议处理规则：

- 优先从文件名提取型号：识别类似 `S-4000`、`S4000`、`SME5200`、`SP-830`、`SIS7000A`、`ADL100` 的模式。
- 如果文件名无型号，使用父级目录作为分类，例如 `Southern Machinery Product`、`Southern Machinery Manual`、`SMThelp Poster`。
- 如果同目录内有同名主题的 PDF、PNG、PPTX，可用主题名聚合为同一产品资料组。
- 对无型号文件保留原始文件名，不要强行猜型号。
- 可把资料类型单独标注：`catalog`、`manual`、`presentation`、`poster`、`drawing`、`audio`、`html tool`。
- 用 `fpath` 作为稳定主键；显示名可以后续人工清洗。
- 对大小、mtime、md5 相同的文件可判为重复候选，但不要仅凭相似标题覆盖原始记录。

## 反爬、跨域、登录与权限注意点

1. 登录与权限
   - 公开目录 `type=public` 无需登录。
   - 私有目录 `type=private` 未登录返回 `403 Permission denied!`。
   - 前端登录后会把 token 存到 `localStorage`，接口请求会带 `X-Token`。
   - 后续爬虫不应尝试绕过私有目录权限；只抓 public 或使用用户授权 token。

2. 跨域
   - 文件直链响应包含 `Access-Control-Allow-Origin: *`。
   - 允许方法包含 `POST, GET, OPTIONS, HEAD, DELETE, PUT`。
   - 暴露了 `Content-Length` 等 header，浏览器端读取文件大小比较方便。

3. 反爬
   - 未发现验证码、强制 Referer、签名校验或 Cloudflare 类挑战。
   - `random` 参数主要是防缓存，不是访问签名。
   - 仍建议限速，避免高并发请求大量 PDF 和图片。

4. 文件与路径编码
   - 路径中有空格、中文标点、全角字符、非断行空格、括号、`&` 等字符。
   - 生成直链时必须按 URL 路径规则编码每个路径段，但保留 `/`。
   - 文件名大小写要保留，例如 `.PDF` 与 `.pdf` 都存在。

5. 大文件与恢复
   - PDF、PNG 体积从几十 KB 到几十 MB 不等。
   - 直链支持 `Accept-Ranges: bytes`，后续下载器应支持断点续传。

## 后续爬虫优先方案

优先采用“接口递归 + 直链下载”的方案：

1. 调用 `GET /api/get/appinfo` 获取站点配置，并确认 public domain。
2. 从 `/` 开始调用 `POST /api/filelist`，仅使用 `type=public`。
3. 递归遍历所有 `folder`。
4. 对所有 `file` 保存原始元数据。
5. 按 `public_domain + encoded(fpath)` 生成真实文件链接。
6. 下载前用 HEAD 校验文件可达性和大小。
7. 对失败项做重试队列，记录状态码和错误信息。

备选方案：

- 如果接口结构改变，再考虑用无头浏览器观察网络请求。
- 如果文件迁移到外部 `link` 字段，优先使用接口返回的 `link` 或 `url` 字段。
- 如果后续需要私有目录，必须先取得合法登录 token，并在请求头中带 `X-Token`。

## 修改文件路径

- `knowledge_research/file_site_research.md`
