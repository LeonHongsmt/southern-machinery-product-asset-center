# File Site Sample Verification Report

生成时间：2026-05-14T09:44:10.024Z

## 入口页面检查

- 请求 URL：https://file.autoinsertion.com/#/
- HTTP 状态码：200
- content-type：text/html; charset=utf-8
- 页面 HTML 长度：2867
- 检测到的资源线索：js, css, assets

## /api/filelist 检查

- 请求 URL：https://file.autoinsertion.com/api/filelist
- 是否可访问：Yes
- HTTP 状态码：200
- content-type：application/json; charset=utf-8
- 根目录返回条目数：Unknown
- 失败原因：None

## 原始响应预览

```text
{"code":200,"data":[{"name":"Southern Machinery Product","size":28672,"mtime":"2026-05-07 17:10:37","ftype":"folder","fpath":"/Southern Machinery Product","ext":"","link":"","token":"","exp":0,"fid":0},{"name":"SMThelp Poster","size":4096,"mtime":"2026-04-15 22:16:48","ftype":"folder","fpath":"/SMTh...
```

## 说明

- 本报告仅验证入口页面和公开根目录接口。
- 本脚本不递归抓取目录，不批量下载文件，不执行完整爬虫流程。
