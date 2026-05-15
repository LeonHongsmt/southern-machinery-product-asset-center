# Data Standardization Report

执行时间：2026-05-15T06:04:44.870Z

## 汇总

- audio 文件识别数量：10
- 型号标准化命中数量：5
- 产品名称修正数量：3
- unknown_model 数量：3（本轮仍保留，不自动乱填）
- public 数量：35
- internal_review 数量：26
- hidden 数量：10

## 仍需人工复核的记录

- unknown_model | 0.8M conveyor w cooling fan 3D.PDF | internal_review | Sample collected from public directory /SMT machine 3D drawing; product model not confidently detected. | Needs manual review: product model not detected | Mapping applied: exact_file_name=0.8M conveyor w cooling fan 3D.PDF | Needs manual confirmation
- unknown_model | 2 Side Dual Table & Head Screw Drive 3D .pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing; product model not confidently detected. | Needs manual review: product model not detected | Mapping applied: exact_file_name=2 Side Dual Table & Head Screw Drive 3D .pdf | Needs manual confirmation
- unknown_model | tool_THT Knowledge Chatbots.html | hidden | Sample collected from public directory /; product model not confidently detected. | Needs manual review: product model not detected | Mapping applied: exact_file_name=tool_THT Knowledge Chatbots.html | Needs manual confirmation
- S-MVF01 | Bulk Feeder S-MVF01.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html. | Grouped 2 sample files under the same product_model + category
- SFY03 | Effortless Flexibility for SMT Lines with SFY03 AGV.png | internal_review | Sample collected from public directory /SMThelp Poster. | Grouped 2 sample files under the same product_model + category
- UV106 | High-Performance EMS Curing Solution SM-UV106.png | internal_review | Sample collected from public directory /SMThelp Poster. | Grouped 2 sample files under the same product_model + category
- SQX350 | High-Precision Low-Stress PCB Depaneling Southern Machinery SQX350 PCB Rou.wav | internal_review | Sample collected from public directory /SMT Audio. | Mapping applied: exact_file_name=High-Precision Low-Stress PCB Depaneling Southern Machinery SQX350 PCB Rou.wav | Standardized product name; Name cleaned from truncated filename; needs sales review
- S-3000 | Radial insertion machine S3000.wav | hidden | Sample collected from public directory /SMT Audio. | Mapping applied: filename_contains=S3000 | Standardized model format
- S-350C | S-350C.png | internal_review | Sample collected from public directory /SMThelp Poster.
- S-460FL | S-460FL Conveyor machine.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html.
- S-680A | S-680A automatic scrap tape cutting machine.wav | hidden | Sample collected from public directory /SMT Audio.
- S-7020T | S-7020T_Terminal_insertion.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html.
- S-JVF02 | S-JVF02 stick feeder JUKI RS-1.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html. | Grouped 2 sample files under the same product_model + category
- S-JVF02 | S-JVF02 Vibration Stick Feeder RS-1.wav | hidden | Sample collected from public directory /SMT Audio.
- S-JVF02 | S-JVF02_Quick_Setup_Guide.png | internal_review | Sample collected from public directory /SMThelp Poster.
- S-MVF01 | S-MVF01 Reciprocating Belt Feeder 1.png | internal_review | Sample collected from public directory /SMThelp Poster. | Grouped 3 sample files under the same product_model + category
- S-WS450 | S-WS450 PC Wave Solder machine.wav | hidden | Sample collected from public directory /SMT Audio.
- S-3000 | S3000 Radial + S7900 Odd Form Insertion Machine w PCB Loading & magazine.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html. | Mapping applied: filename_contains=S3000 | Standardized model format
- S3010A | S3010A +S3020A Radial Insertion machine inline.pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing. | Grouped 2 sample files under the same product_model + category
- S3010A | S3010A Radial + S7020T Bowl Terminal Insertion Machine with PCB Magazine loader inloader.html | internal_review | Sample collected from public directory /SMT machine 3D Drawing in Html. | Grouped 5 sample files under the same product_model + category
- S3010A | S3010A Radial Insertion Machine.wav | hidden | Sample collected from public directory /SMT Audio.
- S3010B | S3010B Radial Insertion Machine.mp3 | hidden | Sample collected from public directory /SMT Audio.
- S-350C | S350C SMThelp 1M Conveyor 3D.PDF | internal_review | Sample collected from public directory /SMT machine 3D drawing. | Mapping applied: filename_contains=S350C | Standardized model format
- S-4000 | S4000 Axial Insertion machine -SMThelp.wav | hidden | Sample collected from public directory /SMT Audio. | Grouped 3 sample files under the same product_model + category | Mapping applied: filename_contains=S4000 | Standardized model format
- S660S | S660S Full Automatic online PCB Separator with Pallet Storage machine.wav | hidden | Sample collected from public directory /SMT Audio.
- S7000 | S7000 Odd Form Insertion Machine.wav | hidden | Sample collected from public directory /SMT Audio.
- S7000 | S7000 Oddform Radial Axial & Tube feeder.pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing.
- S7900 | S7900 odd form inserter.png | internal_review | Sample collected from public directory /SMThelp Poster. | Grouped 2 sample files under the same product_model + category
- SAF1001 | SAF1001 AXIAL TAPE FEEDER TEACH DOCUMENTS.pdf | internal_review | Sample collected from public directory /SMThelp Machine Presentation. | Grouped 2 sample files under the same product_model + category
- SH460D | SH460D High end Conveyor 1M nolight 3D.pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing. | Grouped 2 sample files under the same product_model + category
- SM-UV106CM | SM-UV106CM  UV1.6M Curing Oven 3D.pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing. | Mapping applied: exact_file_name=SM-UV106CM  UV1.6M Curing Oven 3D.pdf | High-confidence cleanup from exact file name
- SME-5200 | SME-5200 Pallet (Fixture) Cleaning Machine_Performance_Validation_Report.pdf | internal_review | Sample collected from public directory /SMThelp Machine Presentation. | Grouped 2 sample files under the same product_model + category
- SME-5200 | SME-5200_Installation_Guide_00.png | internal_review | Sample collected from public directory /SMThelp Poster.
- ALD700 | SMT AOI ALD700 3D.PDF | internal_review | Sample collected from public directory /SMT machine 3D drawing.
- CN2617-03 | SMT JUKI Vacuum nozzle CN2617-03 3D.PDF | internal_review | Sample collected from public directory /SMT machine 3D drawing.
- BG03 | Southern BG03.pdf | internal_review | Sample collected from public directory /SMT machine 3D drawing. | Mapping applied: exact_file_name=Southern BG03.pdf | Product name too short; needs manual confirmation

## 下一步建议

- 继续保留 unknown_model，等人工确认后再补充 mapping 规则。
- 对 BG03、SQX350 这类名称不完整或偏短的记录，建议由销售或产品团队确认正式客户展示名。
- 如果人工审核 CSV 已经有明确结论，下一步最值得做的是把审核结果回写到 mapping 和 visibility 规则。

