# Southern Machinery AI 自动化网站研究总结

本总结汇总第 3 阶段 subagent 分工研究结果。当前阶段只做研究和 Markdown 文档整理，不写业务代码，不创建 `package.json`，不安装依赖，不实现 React / Next / Vite、爬虫或 API。

## 1. 总体技术路线

推荐路线是“先资料抓取与数据结构，后静态前端展示，最后 GitHub + Cloudflare Pages 自动部署”。

文件站 `https://file.autoinsertion.com/#/` 研究结果显示，该站是前端渲染 SPA，入口页面不直接包含文件列表，公开文件列表主要通过接口加载。公开目录可通过文件列表接口递归获取，文件真实链接可由公开域名与文件路径拼接得到。因此后续最优方案不是抓取页面 DOM，而是优先使用“接口递归 + 文件直链验证 + 数据清洗”的方式整理 PDF、图片和说明文档。

产品资料应以 JSON 作为前端主数据格式，以 CSV 和 Excel 作为人工校对、复核和批量整理格式。前端第一版建议做轻量资料站：产品列表页、产品详情页、资料下载区、搜索和分类筛选。部署上优先考虑 Vite 静态站输出到 Cloudflare Pages；如果第一版只做极简展示，也可先用纯 HTML。Next.js 静态导出暂不作为首选，因为当前需求主要是静态资料展示，不需要复杂服务端能力。

## 2. 推荐执行顺序

1. 固化产品数据 schema：确认 `product_model`、`product_name`、`category`、`file_name`、`file_type`、`pdf_links`、`image_links`、`manual_links`、`source_url`、`description`、`remarks`、`created_at`、`updated_at` 等字段。
2. 先做文件站全量清单研究和人工样本校验：确认公开目录、文件类型、路径编码、文件大小、重复文件和无法识别型号的资料比例。
3. 设计爬虫输出格式：先输出 `files_all.json`、`files_unknown_model.csv`、`crawl_errors.csv` 和人工审核 Excel。
4. 基于样本资料整理产品数据：把型号明确的资料归入产品，把无法识别型号的文件保留到待复核清单。
5. 再做前端模板：产品列表页、产品详情页、资料下载模块、图片兜底、搜索和分类筛选。
6. 最后接入 GitHub + Cloudflare Pages：先走 Git 提交触发部署，后续成熟后再考虑定时任务、Deploy Hook 或 GitHub Actions 自动更新。

## 3. 后续真正开发时需要新增哪些文件

真正进入开发阶段后，可能需要新增以下文件或目录；本阶段不创建：

```text
package.json
vite.config.*
tsconfig.json
src/pages/ProductList.*
src/pages/ProductDetail.*
src/components/ProductCard.*
src/components/ProductFilters.*
src/components/DownloadLinks.*
src/components/ImageGallery.*
src/schema/product_schema.*
src/scripts/crawl_file_site.*
src/scripts/export_product_data.*
data/products.json
data/files_all.json
data/files_unknown_model.csv
data/crawl_errors.csv
public/images/products/
public/docs/catalogs/
public/docs/manuals/
public/downloads/
```

如果选择纯 HTML MVP，则可减少前端工程文件；如果选择 Vite 静态站，则需要在开发阶段再创建构建配置和依赖声明。

## 4. 风险点

- 文件站权限风险：公开目录可研究和整理，但私有目录需要合法 token，不应绕过登录或权限。
- 路径编码风险：文件名含空格、特殊字符、大小写差异和可能的中文字符，生成直链时必须保留路径层级并正确编码。
- 型号识别风险：部分文件名没有产品型号，不能强行猜测，应保留原文件名、来源路径和待复核状态。
- 资料版权与公开风险：PDF、图片、说明书是否可发布到 `public/` 需要确认授权，公开 JSON 也不能包含内部备注、token 或敏感字段。
- 数据质量风险：重复文件、失效链接、类型冲突、大小写路径差异会影响前端展示和部署稳定性。
- 营销文案风险：产能、精度、认证、客户案例、保修、交期、ROI 等内容必须来自资料或合同，不能凭空编写。
- 前端展示风险：图片链接失效会导致破图，必须有占位图和固定比例容器；资料链接也需要清楚标注来源和类型。
- 部署风险：Cloudflare Pages 的最终输出目录会公开可访问，构建前需要检查 JSON、图片、PDF 路径和授权状态。

## 5. 下一阶段最小可执行任务

建议下一阶段先做一个“无代码数据样本确认”任务：

1. 从文件站选取 10 到 20 个公开文件样本。
2. 手工记录文件名、目录、真实链接、文件类型、可能型号、是否能访问。
3. 按 `product_schema.md` 的字段整理成一份小型样本表。
4. 标记哪些文件能自动识别型号，哪些需要人工复核。
5. 根据样本结果再决定爬虫规则和前端字段是否需要调整。

这个任务仍可保持在研究和数据规划层面，不必马上写爬虫或前端代码。

## 6. 先做爬虫还是先做前端模板

建议先做爬虫数据规则和小样本验证，再做前端模板。

原因是前端页面依赖稳定字段和可靠资料链接。如果先做前端，很容易因为后续发现字段缺失、图片失效、型号不可识别、PDF 链接结构变化而返工。更稳的顺序是：先确认文件站接口和产品 schema，再用小样本跑通数据结构，最后让前端按稳定 JSON 展示。

但不建议一开始就做完整大规模爬虫。更好的第一步是小样本验证：确认文件列表接口、路径编码、类型识别、型号识别和输出格式都成立后，再进入真正爬虫开发。
