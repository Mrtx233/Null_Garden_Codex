---
title: "阶段 1：创建 Django 项目 + 连接 MySQL"
description: "搭建 Django Vue3 系统的项目骨架，完成 MySQL 数据库的创建与连接配置"
tags:
  - "Django"
  - "开发手册"
---

# 阶段 1：创建 Django 项目 + 连接 MySQL

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：1 / 18 ｜ **定位**：搭建 Django Vue3 系统的项目骨架，完成 MySQL 数据库的创建与连接配置 ｜ **建议学时**：3–4 小时

大家好，我是小马不起床。

---

## 阶段导语

本阶段是整套 Django Vue3 系统从零开发的起点，后续 17 个阶段（RBAC 建表、权限判断、JWT 登录、业务接口、Vue3 对接）均在本阶段建立的项目结构与数据库连接之上展开。

阶段内容包括三部分：统一项目名称与目录结构、安装并创建 Django 项目、在 MySQL 中创建数据库并将 Django 配置为连接该数据库。完成标志为 `python manage.py migrate` 成功建表、浏览器可见 Django 欢迎页面。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 说明 `rbac_project`、`backend`、`config` 三级目录各自的职责
- [ ] 安装 Django 与 MySQL 驱动，区分 `mysqlclient`（优先）与 `pymysql`（备选）的取舍
- [ ] 在 MySQL 中创建字符集为 utf8mb4 的数据库 `rbac_db`
- [ ] 配置 `settings.py` 的 `DATABASES`，使 Django 连接 MySQL
- [ ] 将语言设置为 `zh-hans`、时区设置为 `Asia/Shanghai`
- [ ] 通过 `migrate` 验证数据库连接，通过 `runserver` 确认项目可启动

---

## 前置知识

本阶段为合辑起点，无手册内前置阶段；仅依赖以下通用基础：

| 前置条目 | 具体要求 |
|----------|----------|
| Python 基础 | 可执行解释器命令、会使用 pip 安装第三方包 |
| MySQL 环境 | 本机已安装 MySQL 服务，可通过 `mysql -u root -p` 登录 |
| 命令行操作 | 能在终端中切换目录并执行命令 |

---

## 目录

1. [项目结构与依赖安装](#1-项目结构与依赖安装)
2. [创建 Django 项目](#2-创建-django-项目)
3. [创建 MySQL 数据库](#3-创建-mysql-数据库)
4. [配置 Django 连接 MySQL](#4-配置-django-连接-mysql)
5. [修改语言和时区](#5-修改语言和时区)
6. [测试数据库连接与启动项目](#6-测试数据库连接与启动项目)
7. [阶段小结](#阶段小结)
8. [常见问题与排查](#常见问题与排查)
9. [下一阶段衔接](#下一阶段衔接)

---

## 1. 项目结构与依赖安装

### 1.1 项目名称与目录结构

本合辑用于说明 Django Vue3 系统从零开发的整体步骤，全程统一使用如下项目名：

```text
rbac_project
```

项目的整体目录结构为：

```text
rbac_project/
└── backend/
    ├── manage.py
    └── config/
        ├── settings.py
        ├── urls.py
        ├── asgi.py
        └── wsgi.py
```

三层的职责划分如下：

| 目录 | 职责 |
|------|------|
| `rbac_project` | 总项目文件夹 |
| `backend` | Django 后端文件夹 |
| `config` | Django 的配置目录 |

### 1.2 安装当前阶段需要的包

```bash
pip install django mysqlclient
```

Windows 环境下若 `mysqlclient` 安装失败，可先改用：

```bash
pip install pymysql
```

优先级上仍推荐先尝试 `mysqlclient`。

**要点**

- 项目名、目录层级在全部 18 个阶段中保持不变
- `config` 是配置目录而非 app，`settings.py` 是后续多个阶段反复修改的文件
- 驱动选择遵循"先 `mysqlclient`、失败再 `pymysql`"的顺序

---

## 2. 创建 Django 项目

创建完成后，`backend` 目录应呈现如下结构（`venv` 为虚拟环境（virtual environment）目录）：

```text
backend/
├── manage.py
├── venv/
└── config/
    ├── __init__.py
    ├── settings.py
    ├── urls.py
    ├── asgi.py
    └── wsgi.py
```

**要点**

- `manage.py` 是后续所有命令行操作的入口
- `config/__init__.py` 使配置目录成为可导入的 Python 包
- `asgi.py` 与 `wsgi.py` 分别对应异步与同步的部署入口

---

## 3. 创建 MySQL 数据库

登录 MySQL：

```bash
mysql -u root -p
```

创建数据库并确认：

```sql
CREATE DATABASE rbac_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
exit;
```

`rbac_db` 使用 utf8mb4 字符集与 utf8mb4_unicode_ci 排序规则，为后续存储中文权限名称、用户姓名提供基础。

**要点**

- 数据库名统一为 `rbac_db`，与后续所有阶段的表所在库一致
- 字符集必须为 utf8mb4，排序规则为 utf8mb4_unicode_ci
- `SHOW DATABASES;` 用于当场确认创建结果

---

## 4. 配置 Django 连接 MySQL

配置文件路径：

```text
backend/config/settings.py
```

找到原有的 `DATABASES` 配置，将其改为：

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "rbac_db",
        "USER": "root",
        "PASSWORD": "你的MySQL密码",
        "HOST": "127.0.0.1",
        "PORT": "3306",
        "OPTIONS": {
            "charset": "utf8mb4",
        },
    }
}
```

各配置项含义：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| ENGINE | `django.db.backends.mysql` | 数据库后端切换为 MySQL |
| NAME | `rbac_db` | 与第 3 章创建的库名一致 |
| USER / PASSWORD | `root` / 实际密码 | 登录凭据，需替换为本机 MySQL 密码 |
| HOST / PORT | `127.0.0.1` / `3306` | 本机 MySQL 默认地址与端口 |
| OPTIONS.charset | `utf8mb4` | 与数据库字符集保持一致 |

**要点**

- `PASSWORD` 为占位内容，必须替换为实际的 MySQL 密码
- 五项连接参数（库名、用户、密码、主机、端口）任一不匹配都会导致连接失败
- `charset` 与数据库字符集保持一致，避免中文写入异常

---

## 5. 修改语言和时区

文件仍为：

```text
backend/config/settings.py
```

找到默认配置：

```python
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"
```

改为：

```python
LANGUAGE_CODE = "zh-hans"

TIME_ZONE = "Asia/Shanghai"
```

**要点**

- `zh-hans` 使 Django 后台与校验信息以简体中文显示
- `Asia/Shanghai` 使时间记录与业务所在时区一致
- 两项配置与数据库无关，但影响后续 Admin 后台的使用体验

---

## 6. 测试数据库连接与启动项目

### 6.1 执行 migrate 验证连接

```bash
python manage.py migrate
```

该步骤的作用是让 Django 创建它自己默认需要的表。成功时输出类似：

```text
Applying contenttypes.0001_initial... OK
Applying auth.0001_initial... OK
Applying admin.0001_initial... OK
Applying sessions.0001_initial... OK
```

执行后，MySQL 数据库 `rbac_db` 中会多出若干 Django 默认表。migrate 能跑通即代表 Django 与 MySQL 的连接配置生效。

### 6.2 启动项目

```bash
python manage.py runserver
```

浏览器访问：

```text
http://127.0.0.1:8000/
```

看到 Django 欢迎页面，即说明阶段 1 完成。

**要点**

- `migrate` 同时承担"建默认表"与"验证数据库连接"两个作用
- 输出中的 `Applying ... OK` 是连接配置正确的判定依据
- `runserver` 后可通过 `http://127.0.0.1:8000/` 做最终确认

---

## 阶段小结

| 环节 | 核心产出 |
|------|----------|
| 项目结构定义 | 统一使用 `rbac_project/backend/config` 三层结构 |
| 依赖安装 | django、mysqlclient（备选 pymysql） |
| Django 项目创建 | `manage.py` 与 `config` 配置目录 |
| MySQL 建库 | `rbac_db`（utf8mb4 / utf8mb4_unicode_ci） |
| 连接配置 | `DATABASES` 指向 `127.0.0.1:3306` 的 `rbac_db` |
| 语言与时区 | `zh-hans`、`Asia/Shanghai` |
| 连接验证 | `migrate` 创建 Django 默认表 |
| 启动验证 | `runserver` 后可见 Django 欢迎页面 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| Windows 下 `pip install mysqlclient` 失败 | 该包需要本地编译环境，安装成本较高 | 先执行 `pip install pymysql` 作为替代，条件允许时仍优先尝试 `mysqlclient` |
| `SHOW DATABASES;` 中看不到 `rbac_db` | `CREATE DATABASE` 语句未执行成功或登录账号权限不足 | 重新执行建库语句，并确认使用的 MySQL 账号具备建库权限 |
| `python manage.py migrate` 报连接类错误 | `DATABASES` 中密码、主机、端口与实际 MySQL 不一致 | 逐项核对 `PASSWORD`、`HOST`、`PORT`，确认 MySQL 服务已启动 |
| migrate 输出中出现中文乱码相关异常 | 连接字符集与库字符集不一致 | 确认 `"charset": "utf8mb4"` 已配置，且库为 utf8mb4 |
| 浏览器访问 `http://127.0.0.1:8000/` 无响应 | `runserver` 未启动或端口被占用 | 确认服务在运行，必要时释放 8000 端口后重启 |

---

## 下一阶段衔接

阶段 1 交付的是"可运行、已连库"的 Django 项目。阶段 2（阶段 2：创建 RBAC 四张表.md）将在本阶段的 `backend` 中创建 `rbac` 应用，编写权限、角色、角色权限关联、用户四个模型，并通过迁移在 `rbac_db` 中生成 RBAC 的四张核心表。本阶段的目录结构与数据库配置是阶段 2 全部操作的直接前提。
