# 人工复核清单

## 总览

- 总共需要人工复核：9 条
- 其中 `unknown_model`：3 条
- 名称不规范：9 条
- 分类不明确：1 条

## 逐条复核建议

### MR-001

- 当前型号：`unknown_model`
- 当前名称：`THT Knowledge Chatbots`
- 文件名：`tool_THT Knowledge Chatbots.html`
- source_url：`https://file.autoinsertion.com/public/tool_THT%20Knowledge%20Chatbots.html`
- 为什么需要人工复核：
  当前记录来自 `root` 目录，文件是 HTML 工具页，明显不像标准客户产品资料；同时仍是 `unknown_model`，并带有 `Needs Manual Review` 备注。
- 建议人工怎么判断：
  先确认这是不是内部 chatbot / 工具页。如果是内部工具，建议保持 `unknown_model`，并后续加入“隐藏内部资料”规则；如果确实对应某个具体产品页，再补正式型号和分类。

### MR-002

- 当前型号：`unknown_model`
- 当前名称：`0.8M Conveyor with Cooling Fan 3D`
- 文件名：`0.8M conveyor w cooling fan 3D.PDF`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/0.8M%20conveyor%20w%20cooling%20fan%203D.PDF`
- 为什么需要人工复核：
  这是 3D 演示类资料，名称里没有稳定型号，只描述了结构和尺寸；自动流程不应猜型号。
- 建议人工怎么判断：
  检查业务资料或文件上下文，确认它是否对应现有 conveyor 型号。如果没有稳定型号，就保持 `unknown_model`，只规范名称。

### MR-003

- 当前型号：`unknown_model`
- 当前名称：`2 Side Dual Table and Head Screw Drive 3D`
- 文件名：`2 Side Dual Table & Head Screw Drive 3D .pdf`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/2%20Side%20Dual%20Table%20%26%20Head%20Screw%20Drive%203D%20.pdf`
- 为什么需要人工复核：
  这条也是 3D 结构演示资料，没有明确产品型号，且名称像方案描述，不像正式产品名。
- 建议人工怎么判断：
  先确认它是具体机型还是结构方案。如果只是结构方案，建议保持 `unknown_model`，并考虑不进入客户展示页。

### MR-004

- 当前型号：`ALD700`
- 当前名称：`SMT AOI 3D`
- 文件名：`SMT AOI ALD700 3D.PDF`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/SMT%20AOI%20ALD700%203D.PDF`
- 为什么需要人工复核：
  型号已经识别到，但名称仍保留 `3D` 演示痕迹，不适合作为客户展示名称。
- 建议人工怎么判断：
  确认客户展示页是应写 `SMT AOI` 还是 `ALD700 SMT AOI`，再补到 mapping 表。

### MR-005

- 当前型号：`CN2617-03`
- 当前名称：`SMT JUKI Vacuum nozzle 3D`
- 文件名：`SMT JUKI Vacuum nozzle CN2617-03 3D.PDF`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/SMT%20JUKI%20Vacuum%20nozzle%20CN2617-03%203D.PDF`
- 为什么需要人工复核：
  型号有了，但名称大小写和客户展示语气还不规范，仍带 `3D` 后缀。
- 建议人工怎么判断：
  确认是否采用 `SMT JUKI Vacuum Nozzle` 作为正式名称，并保留 `CN2617-03` 作为主型号。

### MR-006

- 当前型号：`S350C`
- 当前名称：`SMThelp 1M Conveyor 3D`
- 文件名：`S350C SMThelp 1M Conveyor 3D.PDF`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/S350C%20SMThelp%201M%20Conveyor%203D.PDF`
- 为什么需要人工复核：
  名称带有 `SMThelp` 和 `3D` 痕迹，像文件标题，不像客户展示名称；同时型号写法可能还需要和 `S-350C` 统一。
- 建议人工怎么判断：
  确认最终展示型号写法，以及客户展示名是否用 `1M Conveyor` 或更完整的正式名称。

### MR-007

- 当前型号：`SH460D`
- 当前名称：`High end Conveyor 1M nolight 3D`
- 文件名：`SH460D High end Conveyor 1M nolight 3D.pdf`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/SH460D%20High%20end%20Conveyor%201M%20nolight%203D.pdf`
- 为什么需要人工复核：
  名称仍是文件式表达，语法和大小写都不够规范，并带 `3D` 后缀。
- 建议人工怎么判断：
  确认标准英文展示名称，比如是否整理为 `High-End 1M Conveyor (No Light)`。

### MR-008

- 当前型号：`SM-UV106CM`
- 当前名称：`UV1.6M Curing Oven 3D`
- 文件名：`SM-UV106CM  UV1.6M Curing Oven 3D.pdf`
- source_url：`https://file.autoinsertion.com/public/SMT%20machine%203D%20drawing/SM-UV106CM%20%20UV1.6M%20Curing%20Oven%203D.pdf`
- 为什么需要人工复核：
  型号已经清理过，但名称仍保留 `3D` 演示后缀。
- 建议人工怎么判断：
  确认客户展示名是否应简化为 `UV1.6M Curing Oven`，再更新 mapping 表。

### MR-009

- 当前型号：`S-350C`
- 当前名称：`S-350C`
- 文件名：`S-350C.png`
- source_url：`https://file.autoinsertion.com/public/SMThelp%20Poster/S-350C.png`
- 为什么需要人工复核：
  这是 poster 图片，当前名称只有型号，没有正式产品名；同时它是否适合直接进入客户展示页也需要确认。
- 建议人工怎么判断：
  如果这是可公开展示的营销物料，建议补正式产品名；如果只是内部海报素材，建议后续加隐藏规则。

## 下一步建议

### 哪些记录可以补到 `product_model_mapping.json`

- `MR-004` 到 `MR-008`
  这些记录的型号已经相对明确，主要问题是名称不规范、带 `3D` 后缀，适合人工确认后补到 mapping 表。

### 哪些记录应该保持 `unknown_model`

- `MR-001`
- `MR-002`
- `MR-003`

这 3 条当前都缺少足够稳定的型号证据。除非人工能从业务上下文确认型号，否则建议继续保持 `unknown_model`。

### 哪些记录可能不适合进入客户展示页

- `MR-001`
  更像内部工具或 chatbot 页面。
- `MR-002`
- `MR-003`
  更像结构演示或方案文件，不一定适合作为标准产品展示资产。
- `MR-009`
  是 poster 素材，是否公开展示需要业务判断。
