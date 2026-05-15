# File Site Samples Report

生成时间：2026-05-15T03:40:44.200Z
目标样本数量：100

## 目录请求概况

- 实际请求目录数：10
- 实际采集文件数：100
- 校验失败数：0

## 已请求目录

- / | HTTP 200 | files 1 | folders 8 | items 9
- /Southern Machinery Product | HTTP 200 | files 287 | folders 1 | items 288
- /Southern Machinery Manual | HTTP 200 | files 94 | folders 0 | items 94
- /SMThelp Machine Presentation | HTTP 200 | files 40 | folders 0 | items 40
- /SMThelp Poster | HTTP 200 | files 41 | folders 0 | items 41
- /Product landing Page | HTTP 200 | files 67 | folders 0 | items 67
- /SMT machine 3D Drawing in Html | HTTP 200 | files 197 | folders 0 | items 197
- /SMT machine 3D drawing | HTTP 200 | files 155 | folders 0 | items 155
- /SMT Audio | HTTP 200 | files 49 | folders 0 | items 49
- /Southern Machinery Product/S-3516 computer wire stripping machine | HTTP 200 | files 2 | folders 0 | items 2

## 文件类型统计

- PDF 数量：47
- Image 数量：12
- Manual 数量：4
- Document 数量：37
- Other 数量：0

## 型号识别情况

- 已识别 product_model 数量：97
- unknown_model 数量：3

## 校验失败记录

- 无

## 请求失败或跳过的目录

- 无

## 下一步建议

- 先对 unknown_model 和被聚合概率较高的样本做人工复核，确认产品型号识别规则是否需要补充。
- 当前仍属于扩大公开样本验证，不建议直接切换为全站递归抓取。
- 当样本覆盖度稳定后，优先建立产品型号人工修正表，再继续扩样本。
