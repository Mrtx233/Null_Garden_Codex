---
title: "Vague-Search"
description: "一个面向 Excel / WPS 表格文件的模糊搜索采集项目，重点解决搜索、下载、去重、语种识别与结果归档。"
githubUrl: ""
tags:
  - Python
  - Redis
  - FastText
  - DrissionPage
draft: false
---

# Vague-Search

## 项目定位

Vague-Search 更像一套内部生产脚本集合，而不是通用 SDK。它围绕 Google 和 Bing 的 `filetype:` 搜索，把命中的表格文件下载下来，再按语种和来源归档。

## 技术栈

- Python
- Redis
- FastText
- DrissionPage
- openpyxl / xlrd

## 核心能力

- 按关键词执行 Google 和 Bing 搜索
- 下载命中的 Excel / WPS 文件
- 基于 Redis 做去重和断点续跑
- 基于 FastText 做语种识别
- 按语种归档处理结果

## 适合场景

适合做表格类公开资料采集、搜索结果归档、批量文件下载与后续分析。

## GitHub 链接

待填写。
