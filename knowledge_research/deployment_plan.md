# GitHub + Cloudflare Pages 自动部署方案研究

## 结论摘要

当前项目更像一个资料型静态站：核心内容来自产品资料、结构化 JSON、图片和 PDF，暂未出现必须依赖服务端渲染、数据库写入、登录态或动态 API 的需求。因此推荐部署路线如下：

1. **首选：Vite 静态站构建**  
   适合后续由 `src/` 组织页面、组件、筛选交互和数据展示，并把产物输出到 `dist/`。Cloudflare Pages 对 React/Vite 的默认构建约定是构建命令 `npm run build`、输出目录 `dist`。
2. **备选：纯 HTML 静态站**  
   如果第一版只需要少量 HTML 页面、CSS、图片、JSON 和 PDF，不需要组件化前端，则可以不设置构建命令，直接把静态目录作为输出目录发布。
3. **暂不优先：Next.js 静态导出**  
   Next.js 静态导出适合已经明确需要 Next 路由、图片生态、MDX 或更复杂页面工程的团队。对本项目而言，Next.js 会带来额外框架复杂度；若只做静态产品资料站，Vite 或纯 HTML 更轻。

参考依据：

- Cloudflare Pages 支持连接 GitHub 仓库，并在分支推送后自动构建部署；同时会提供预览部署、PR 预览 URL 和仓库状态检查。见 [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)。
- Cloudflare Pages 官方构建配置表中，React/Vite 的常见构建命令为 `npm run build`、输出目录为 `dist`；Next.js 静态导出的输出目录为 `out`；无框架项目可不填写构建命令。见 [Cloudflare Pages Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)。
- Cloudflare Pages Deploy Hooks 可由 CMS、资料更新系统或外部任务触发重新部署。见 [Cloudflare Pages Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)。
- 若不用 Cloudflare Git 集成，也可以通过 GitHub Actions + Wrangler 直接上传预构建产物，但这更适合需要完全自定义 CI 的场景。见 [Use Direct Upload with continuous integration](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)。
- GitHub Actions 中，`workflow_dispatch` 和 `repository_dispatch` 可用于显式触发工作流；需要注意递归触发和 token 权限。见 [GitHub Docs: Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)。

## 1. 项目形态选择

### 推荐方案：Vite 静态站

适用条件：

- 需要用组件组织产品卡片、筛选器、资料详情页、下载入口等界面。
- 页面仍可在构建期生成，部署产物是纯静态文件。
- 产品资料来自本仓库中的 JSON、Markdown、图片、PDF 等静态资源。
- 未来可能加入搜索、分类、表格排序、轻量交互，但不需要后端运行时。

优点：

- 构建快，产物简单，和 Cloudflare Pages 默认约定匹配。
- 静态资源可通过 `public/` 原样复制到输出目录。
- 后续前端 agent 若要实现交互界面，工程结构更自然。

注意：

- 这是未来实施建议，不代表当前研究阶段要创建 `package.json` 或安装依赖。
- 页面数据应尽量在构建期读取本地 JSON，避免上线后依赖不稳定外部接口。

### 备选方案：纯 HTML

适用条件：

- 第一版页面数量少，主要展示公司介绍、产品目录、PDF 下载和图片。
- 不需要复杂组件、路由、构建产物 hash、前端状态管理。
- 希望部署链路极简。

优点：

- Cloudflare Pages 可以直接发布静态目录。
- 不需要 Node 构建环境，失败面最小。
- 对资料展示类 MVP 很友好。

限制：

- 页面复用、批量生成和数据驱动展示能力弱。
- 后续产品数量增多后，维护成本会快速上升。

### 不建议作为首选：Next.js 静态导出

适用条件：

- 已经确定要使用 Next.js 路由、MDX、复杂页面生成流程或团队已有 Next.js 规范。
- 明确只使用静态导出能力，不依赖 Node 服务端运行时。

不作为首选的原因：

- 对当前资料站目标偏重。
- 静态导出需要关注图片、动态路由、客户端导航和输出目录等约束。
- 若后续需要 Cloudflare 原生 Next 适配，会引入 `@cloudflare/next-on-pages` 一类部署路径，复杂度高于 Vite 静态站。

## 2. GitHub 仓库结构建议

建议采用“源资料、静态公开资源、前端源码、研究文档”分层：

```text
/
  data/
    products.json
    categories.json
    sources.json

  public/
    images/
      products/
      brand/
    docs/
      catalogs/
      manuals/
    downloads/

  src/
    pages/
    components/
    schema/
    scripts/

  knowledge_research/
    deployment_plan.md
    product_schema.md
    crawler_plan.md
    frontend_source_display.md

  README.md
```

说明：

- `data/`：保存构建期读取的结构化资料，例如产品、分类、来源、更新时间、PDF 索引等。
- `public/`：保存需要被原样部署的公开静态资源，例如图片、PDF、favicon、robots 文件等。
- `src/`：未来前端源码区域，用于页面、组件、数据读取和构建逻辑。
- `knowledge_research/`：只放研究文档和方案，不参与前端运行时。
- 不建议把大体积原始爬取缓存、临时截图、未压缩源文件混入最终发布目录；应与可公开资源分开。

如果采用 Vite，部署输出通常是 `dist/`。`dist/` 应视为构建产物，通常不提交到 GitHub，由 Cloudflare Pages 在部署时生成。

如果采用纯 HTML，可把一个明确的公开目录作为部署根目录，例如 `public/` 或未来单独的 `site/`。为了避免和 Vite 的 `public/` 语义混淆，若长期走纯 HTML，建议建立单独站点目录；但当前阶段不需要创建。

## 3. Cloudflare Pages 部署流程

推荐使用 Cloudflare Pages 的 GitHub 集成，而不是一开始就用 GitHub Actions 自行上传。

流程建议：

1. 在 GitHub 创建项目仓库，并推送主分支。
2. 登录 Cloudflare Dashboard，进入 Workers & Pages。
3. 创建 Pages 项目，选择连接 GitHub 仓库。
4. 授权 Cloudflare GitHub App 访问目标仓库；组织仓库需要确认组织级安装权限。
5. 选择生产分支，建议为 `main`。
6. 根据项目形态填写构建设置：
   - Vite：框架选择 Vite 或 React/Vite，输出目录为 `dist`。
   - 纯 HTML：不使用框架预设，构建命令留空或按 Cloudflare 建议使用空构建成功命令，输出目录指向静态站目录。
   - Next.js 静态导出：输出目录为 `out`。
7. 保存后触发首次部署。
8. 绑定自定义域名，确认 DNS、HTTPS、重定向和索引策略。
9. 后续每次推送到生产分支会触发生产部署；推送到非生产分支或 PR 可生成预览部署。

建议的分支策略：

- `main`：生产部署分支。
- `develop` 或功能分支：预览部署。
- PR：用于预览资料和页面变更，合并后发布生产。

Cloudflare Pages Git 集成的好处是部署状态会回写到 GitHub，PR 中也能查看预览地址，适合多 agent 协作时审查资料和页面变更。

## 4. 自动构建命令建议

### Vite 静态站

建议配置方向：

- 构建命令：`npm run build`
- 输出目录：`dist`
- 根目录：仓库根目录，除非未来变成 monorepo。

原因：

- 这是 Cloudflare Pages 对 React/Vite 的官方常见配置。
- Vite 会把前端源码构建成静态 HTML、CSS、JS 和资源文件，适合 Pages 托管。

### 纯 HTML 静态站

建议配置方向：

- 构建命令：留空，或使用 Cloudflare 文档建议的空构建成功命令。
- 输出目录：明确的静态站目录，例如 `public/` 或未来 `site/`。

注意：

- 如果把 `public/` 作为最终发布目录，里面所有文件默认都可能对公网可访问。
- 研究文档、原始数据、未确认版权的资料不应放入发布目录。

### Next.js 静态导出

建议配置方向：

- 构建命令：Next.js 静态导出对应的构建命令。
- 输出目录：`out`

注意：

- 只有在确定使用 Next.js 静态导出时才采用。
- 不应引入需要服务端运行时的 Next.js 功能，除非后续明确改成 Cloudflare Pages Functions 或 Workers 路线。

## 5. 静态资源、JSON、图片、PDF 的部署方式

### JSON

建议分两类：

- 构建期数据：放在 `data/`，由构建过程读取后生成页面或静态索引。
- 运行时公开 JSON：放在 `public/data/` 或构建产物中的公开路径，供前端页面直接请求。

注意：

- 公开 JSON 不应包含密钥、内部备注、未授权联系方式、爬虫调试字段或版权状态不明的原始内容。
- 需要保留 `source_url`、`updated_at`、`checksum` 等字段，方便审查资料来源和更新状态。

### 图片

建议：

- 产品图片放在 `public/images/products/`。
- 品牌、Logo、占位图放在 `public/images/brand/`。
- 文件名使用稳定 slug，避免中文、空格和随机命名。
- 页面引用尽量使用相对站点根路径，避免本地绝对路径。

注意：

- 上线前应压缩图片，避免 Cloudflare 构建和访问性能受影响。
- 产品主图、缩略图、详情图应建立命名规范，减少页面和数据之间的路径错配。

### PDF

建议：

- 产品目录放在 `public/docs/catalogs/`。
- 说明书、规格书放在 `public/docs/manuals/`。
- 下载型资料放在 `public/downloads/`。

注意：

- PDF 往往较大，应避免把无用版本、重复版本和扫描原件全部发布。
- 若 PDF 涉及版权或供应商限制，需要在发布前确认授权。
- 页面上应显示文件大小、更新时间、资料语言和来源，方便用户判断是否下载。

### Cloudflare Pages 静态行为

Cloudflare Pages 会把输出目录中的静态文件发布到边缘网络。若需要自定义缓存、下载、安全头或重定向，可在静态资源目录中放置 Pages 支持的规则文件，例如 `_headers` 和 `_redirects`。本研究文档只提出方向，不编写配置文件。

需要特别注意：

- `_headers` 可用于设置静态资源响应头。
- `_redirects` 可用于配置静态重定向。
- 重定向规则优先于 headers。
- 规则文件应进入最终输出目录，否则不会生效。

## 6. 后续自动更新资料时如何触发部署

推荐按资料来源和自动化成熟度分阶段：

### 阶段一：Git 提交触发

资料更新脚本或人工整理完成后，把变更提交到 GitHub：

- 更新 `data/` 中的 JSON。
- 更新 `public/images/` 中的图片。
- 更新 `public/docs/` 中的 PDF。
- 推送到功能分支生成预览部署。
- 审查通过后合并到 `main`，Cloudflare Pages 自动发布生产。

优点：

- 所有资料变更可追踪、可回滚、可审查。
- 最适合多 agent 和人工审核并行的早期阶段。

### 阶段二：GitHub Actions 定时更新资料

当爬取、清洗、校验流程稳定后，可用 GitHub Actions 定时运行资料更新任务。任务完成后提交变更到分支或创建 PR，由 Cloudflare Pages 在合并后部署。

建议：

- 定时任务只创建 PR，不直接推生产。
- PR 中附上数据变更摘要，例如新增产品数、图片变化、PDF 变化、失败来源。
- 避免资料更新工作流和部署工作流互相递归触发。

GitHub 文档提醒，使用默认 `GITHUB_TOKEN` 触发的部分事件不会再次触发工作流，以避免递归；如确实需要跨工作流触发，应使用合适的 GitHub App token 或 PAT，并限制权限。

### 阶段三：Cloudflare Deploy Hook 触发

如果资料来源来自 CMS、外部数据平台或独立爬虫系统，可使用 Cloudflare Pages Deploy Hook：

- 外部系统更新资料后调用 Deploy Hook。
- Cloudflare Pages 重新拉取仓库并构建。
- 适合“内容源已更新，但仓库内容或构建过程会同步读取最新资料”的场景。

注意：

- Deploy Hook 本身只能触发构建，不能替代资料入库、提交或校验。
- Hook URL 应当视为敏感信息，不应写入前端代码、公开 JSON 或公开文档。
- 如果资料实际存放在 GitHub 仓库，最清晰的方式仍然是提交变更触发部署。

### 阶段四：GitHub Actions + Wrangler 直接上传

只有在以下情况才建议考虑：

- Cloudflare Git 集成无法满足复杂 CI 需求。
- 需要先在 GitHub Actions 中完成复杂构建、校验、压缩、签名或产物归档。
- 希望完全由 GitHub Actions 控制部署节奏。

这种路线需要 Cloudflare API Token、Account ID 和 Wrangler 部署命令，安全和维护成本更高。对当前项目，暂不作为首选。

## 7. 风险点和注意事项

### 技术选型风险

- 过早选择 Next.js 可能让静态资料站承担不必要复杂度。
- 纯 HTML 初期最快，但产品数量增长后维护困难。
- Vite 是较平衡方案，但需要后续建立构建依赖和前端工程规范。

### Cloudflare Pages 项目模式风险

- Cloudflare 文档说明，使用 Git 集成创建的 Pages 项目不能直接切换成 Direct Upload 模式；如后续不想每次 push 都自动构建，可以关闭自动部署，再用 Wrangler 上传。
- 因此第一次创建 Pages 项目前，应确认是走 Git 集成还是 Direct Upload。当前建议走 Git 集成。

### 资料公开风险

- `public/` 或最终输出目录中的文件都会被公开访问。
- 不应发布供应商未授权 PDF、内部备注、原始爬虫日志、API token、账号信息或未清洗的联系人数据。
- JSON 中尤其要避免包含隐藏字段，因为前端不展示不代表用户无法访问。

### 静态路径风险

- 图片、PDF、JSON 的路径必须和页面引用一致。
- 文件名建议使用小写英文、数字和短横线，避免空格、中文、大小写混用。
- Windows 本地大小写不敏感，但线上路径可能表现出大小写差异问题，命名要统一。

### 缓存与更新风险

- 静态资源被浏览器和边缘缓存后，文件同名覆盖可能导致用户短时间看到旧版本。
- 对经常更新的图片、PDF 和 JSON，应考虑文件名带版本号、内容 hash 或在页面数据中记录更新时间。
- HTML 页面应避免长缓存；静态大资源可根据稳定程度设置更长缓存策略。

### 构建稳定性风险

- 自动资料更新可能带入格式错误 JSON、缺失图片、失效 PDF 路径，导致构建失败或页面缺图。
- 构建前应增加数据 schema 校验、链接检查、图片存在性检查和 PDF 文件大小检查。
- 多 agent 同时写文档或数据时，应通过 PR 审查和小批量合并减少冲突。

### 权限与密钥风险

- Cloudflare GitHub App 只应授权必要仓库。
- GitHub Actions secrets 只放在需要的仓库或环境中。
- Deploy Hook URL、Cloudflare API Token、GitHub PAT 不应提交到仓库。
- 自动化 token 应采用最小权限，并定期轮换。

### SEO 与访问风险

- 预览环境和 `pages.dev` 默认域名可能被搜索引擎索引；生产前应规划 canonical、robots 和自定义域策略。
- 若产品页面由客户端 JS 动态渲染，搜索引擎可见性可能弱于构建期生成 HTML。
- 面向海外客户时，需要关注图片体积、PDF 大小、首屏性能和移动端体验。

## 建议实施顺序

1. 先以 GitHub 仓库作为资料和前端源码的唯一事实来源。
2. 第一版若追求最快上线，可用纯 HTML 或非常轻量的 Vite 静态站。
3. 一旦出现产品列表筛选、数据驱动详情页、批量页面生成需求，切到 Vite 静态构建。
4. Cloudflare Pages 使用 GitHub 集成，生产分支为 `main`，PR 使用预览部署。
5. 图片、PDF、公开 JSON 统一进入最终静态输出目录，并在发布前做路径和授权检查。
6. 后续资料自动更新优先走“生成 PR -> 审查 -> 合并 -> 自动部署”，成熟后再考虑 Deploy Hook 或 Direct Upload。
