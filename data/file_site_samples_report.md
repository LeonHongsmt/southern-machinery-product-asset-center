# File Site Samples Report

验证时间：2026-05-15T01:03:19.996Z

## 请求目录

- /：HTTP 200，返回 9 个条目
- /Southern Machinery Product：HTTP 200，返回 288 个条目
- /Southern Machinery Manual：HTTP 200，返回 94 个条目
- /SMThelp Poster：HTTP 200，返回 41 个条目
- /SMThelp Machine Presentation：HTTP 200，返回 40 个条目

## 采集结果

- 成功采集条数：20
- 请求目录数：5

## 文件类型统计

- pdf：5
- image：10
- manual：3
- document：2
- other：0

## 型号识别情况

- 已识别型号条数：15
- unknown_model 条数：5

## 失败或异常情况

- 无

## 下一步建议

- 可以先把这批真实样本人工复核，确认 product_model 识别规则是否足够稳定。
- 如果 PDF、图片、manual 的分类结果符合预期，再扩大到更多公开目录，但仍保持限量采样。
- 样本确认稳定后，再整理为正式 product_assets.json，而不是直接进入完整全站抓取。
