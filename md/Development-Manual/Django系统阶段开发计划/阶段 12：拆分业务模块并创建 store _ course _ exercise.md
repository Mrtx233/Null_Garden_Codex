# 阶段 12：拆分业务模块并创建 store / course / exercise

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：12 / 18 ｜ **定位**：按业务域拆分 Django 应用并建立门店、课程、动作数据表 ｜ **建议学时**：8–10 小时

大家好，我是小马不起床。

---

## 阶段导语

本阶段将系统从单一的 rbac 应用扩展为多业务模块结构。依据上传 SQL 中的门店、省份、用户门店关系、课程分类、课程、课程收藏、门店课程排期、动作分类、动作、动作收藏等表，创建 `store`、`course`、`exercise` 三个应用（app），分别承载门店域、课程域与动作域。

本阶段只做模型层搭建：创建 app、配置 `settings.py`、编写 `models.py`、注册 `admin.py`、生成迁移并创建 MySQL 表。接口、Vue 页面、权限菜单与收藏功能逻辑均不在本阶段范围内。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 使用 `startapp` 创建 `store`、`course`、`exercise` 三个应用并在 `settings.py` 中注册
- [ ] 依据 SQL 定义门店域三张表（省份、门店、用户门店关系）的模型
- [ ] 依据 SQL 定义课程域四张表（分类、课程、收藏、门店课程排期）的模型
- [ ] 依据 SQL 定义动作域三张表（分类、动作、收藏）的模型
- [ ] 正确配置跨应用外键、唯一约束与索引，并在 Django Admin 中注册各模型
- [ ] 生成并执行迁移，在 MySQL 与 Admin 后台确认 10 张业务表创建成功

---

## 前置知识

本阶段依赖阶段 11（`阶段 11：用户档案查询和修改接口.md`）与阶段 10（`阶段 10：用户扩展档案信息表.md`）的内容：

| 前置条目 | 具体要求 |
|----------|----------|
| SysUser / SysRole | rbac 应用已提供用户与角色模型，供跨应用外键引用 |
| 模型与迁移 | 掌握 `models.py` 编写与 `makemigrations`、`migrate` 流程 |
| Django Admin | 了解 `@admin.register` 与 `list_display`、`search_fields`、`list_filter` |
| settings 配置 | 知道 `INSTALLED_APPS` 的作用与位置 |

若上述内容尚不熟悉，建议先完成阶段 10、阶段 11 的学习。

---

## 目录

1. [目标结构与范围](#1-目标结构与范围)
2. [创建三个应用](#2-创建三个应用)
3. [注册应用](#3-注册应用)
4. [store 模块](#4-store-模块)
5. [course 模块](#5-course-模块)
6. [exercise 模块](#6-exercise-模块)
7. [生成并执行迁移](#7-生成并执行迁移)
8. [检查 MySQL 表](#8-检查-mysql-表)
9. [启动后台检查 Admin](#9-启动后台检查-admin)
10. [阶段完成标准与模块职责](#10-阶段完成标准与模块职责)
11. [阶段小结](#阶段小结)
12. [常见问题与排查](#常见问题与排查)
13. [下一阶段衔接](#下一阶段衔接)

---

## 1. 目标结构与范围

### 1.1 后端目标结构

本阶段完成后的后端结构为：

```text
backend/
├── rbac/          # 用户、角色、权限、登录、JWT
├── store/         # 省份、门店、用户门店关系
├── course/        # 课程分类、课程、用户收藏课程、门店课程排期
└── exercise/      # 动作分类、动作、用户收藏动作
```

上传 SQL 中包含门店、省份、用户门店关系、课程分类、课程、课程收藏、门店课程排期、动作分类、动作、动作收藏这些表。

### 1.2 本阶段范围

| 本阶段只做 | 本阶段暂不做 |
|------------|--------------|
| 创建 store / course / exercise 三个 app | 接口 |
| 配置 `settings.py` | Vue 页面 |
| 编写 `models.py` | 权限菜单 |
| 注册 `admin.py` | 收藏功能逻辑 |
| 生成迁移并创建 MySQL 表 | |

**要点**：

- **要点**：rbac 负责权限与登录，业务域拆入 store、course、exercise 三个新 app。
- **要点**：本阶段只建模型与建表，接口逻辑留待后续阶段。

---

## 2. 创建三个应用

确认位于 `rbac_project/backend`，执行：

```bash
python manage.py startapp store
python manage.py startapp course
python manage.py startapp exercise
```

创建后目录应变为：

```text
backend/
├── rbac/
├── store/
├── course/
└── exercise/
```

**要点**：

- **要点**：`startapp` 需在含 `manage.py` 的后端目录执行。
- **要点**：三个 app 名称与业务域一一对应，后续 `models.py` 分别归属。

---

## 3. 注册应用

打开 `backend/config/settings.py`，找到：

```python
INSTALLED_APPS = [
```

加入：

```python
"store",
"course",
"exercise",
```

建议放在 `rbac` 后面：

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",

    "rbac",
    "store",
    "course",
    "exercise",
]
```

**要点**：

- **要点**：app 未注册则 `makemigrations <app>` 不生效。
- **要点**：业务 app 置于 `rbac` 之后，保持权限域优先的顺序约定。

---

## 4. store 模块

store 负责三张表：

| 表名 | 说明 |
|------|------|
| `t_store_province` | 省份/区域表 |
| `t_store` | 门店表 |
| `y_user_store` | 用户门店关系表 |

### 4.1 `backend/store/models.py`

```python
from django.db import models

from rbac.models import SysUser, SysRole


class StoreProvince(models.Model):
    """
    门店所属省份/区域表
    对应 MySQL 表：t_store_province
    """

    province_id = models.BigAutoField(
        primary_key=True,
        verbose_name="省份ID"
    )

    province_name = models.CharField(
        max_length=64,
        verbose_name="省份名称"
    )

    center_lng = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="省份中心经度"
    )

    center_lat = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="省份中心纬度"
    )

    class Meta:
        db_table = "t_store_province"
        verbose_name = "门店省份/区域"
        verbose_name_plural = "门店省份/区域"

    def __str__(self):
        return self.province_name


class Store(models.Model):
    """
    门店基础信息表
    对应 MySQL 表：t_store
    """

    STORE_TYPE_CHOICES = (
        (1, "铁馆"),
        (2, "商业私教馆"),
    )

    OPERATING_CHOICES = (
        (1, "营业"),
        (0, "停业"),
    )

    store_id = models.BigAutoField(
        primary_key=True,
        verbose_name="门店ID"
    )

    store_name = models.CharField(
        max_length=64,
        verbose_name="门店名称"
    )

    store_type = models.IntegerField(
        choices=STORE_TYPE_CHOICES,
        verbose_name="门店类型"
    )

    province = models.ForeignKey(
        StoreProvince,
        on_delete=models.PROTECT,
        db_column="province_id",
        related_name="stores",
        verbose_name="省份ID"
    )

    province_name = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="省份名称"
    )

    city = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="城市"
    )

    district = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="区/县"
    )

    address = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="详细地址"
    )

    store_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="门店电话"
    )

    store_image_url = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="门店图片"
    )

    store_introduction = models.TextField(
        null=True,
        blank=True,
        verbose_name="门店介绍"
    )

    business_hours = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="营业时间"
    )

    is_operating = models.IntegerField(
        default=1,
        choices=OPERATING_CHOICES,
        verbose_name="是否营业"
    )

    store_lng = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="门店经度"
    )

    store_lat = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name="门店纬度"
    )

    class Meta:
        db_table = "t_store"
        verbose_name = "门店"
        verbose_name_plural = "门店"

    def __str__(self):
        return self.store_name


class UserStore(models.Model):
    """
    用户与门店关联表
    对应 MySQL 表：y_user_store
    """

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="记录ID"
    )

    user = models.ForeignKey(
        SysUser,
        on_delete=models.PROTECT,
        db_column="user_id",
        related_name="store_relations",
        verbose_name="用户ID"
    )

    role = models.ForeignKey(
        SysRole,
        on_delete=models.PROTECT,
        db_column="role_id",
        related_name="user_store_relations",
        verbose_name="角色ID"
    )

    store = models.ForeignKey(
        Store,
        on_delete=models.PROTECT,
        db_column="store_id",
        related_name="user_relations",
        verbose_name="门店ID"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="关联时间"
    )

    class Meta:
        db_table = "y_user_store"
        verbose_name = "用户门店关系"
        verbose_name_plural = "用户门店关系"
        indexes = [
            models.Index(fields=["user", "created_at"], name="idx_user_time"),
            models.Index(fields=["user", "store"], name="idx_user_store"),
            models.Index(fields=["user", "role", "store"], name="idx_user_role_store"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.store.store_name}"
```

### 4.2 store 模型字段说明

StoreProvince（`t_store_province`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `province_id` | BigAutoField | 主键、自增 | 省份 ID |
| `province_name` | CharField(64) | 必填 | 省份名称 |
| `center_lng` | DecimalField(10,6) | null、blank | 省份中心经度 |
| `center_lat` | DecimalField(10,6) | null、blank | 省份中心纬度 |

Store（`t_store`）关键字段：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `store_id` | BigAutoField | 主键、自增 | 门店 ID |
| `store_name` | CharField(64) | 必填 | 门店名称 |
| `store_type` | IntegerField | choices=STORE_TYPE_CHOICES | 门店类型（1 铁馆 / 2 商业私教馆） |
| `province` | ForeignKey(StoreProvince) | PROTECT、`db_column="province_id"`、`related_name="stores"` | 所属省份 |
| `province_name` | CharField(64) | null、blank | 省份名称冗余列 |
| `city` / `district` | CharField(64) | null、blank | 城市 / 区县 |
| `address` | CharField(255) | null、blank | 详细地址 |
| `store_phone` | CharField(20) | null、blank | 门店电话 |
| `store_image_url` | CharField(255) | null、blank | 门店图片 |
| `store_introduction` | TextField | null、blank | 门店介绍 |
| `business_hours` | CharField(64) | null、blank | 营业时间 |
| `is_operating` | IntegerField | default=1、choices=OPERATING_CHOICES | 是否营业（1 营业 / 0 停业） |
| `store_lng` / `store_lat` | DecimalField(10,6) | null、blank | 门店经度 / 纬度 |

UserStore（`y_user_store`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BigAutoField | 主键、自增 | 记录 ID |
| `user` | ForeignKey(SysUser) | PROTECT、`db_column="user_id"` | 关联用户 |
| `role` | ForeignKey(SysRole) | PROTECT、`db_column="role_id"` | 关联角色 |
| `store` | ForeignKey(Store) | PROTECT、`db_column="store_id"` | 关联门店 |
| `created_at` | DateTimeField | auto_now_add | 关联时间 |

索引：`idx_user_time`(user, created_at)、`idx_user_store`(user, store)、`idx_user_role_store`(user, role, store)。

### 4.3 `backend/store/admin.py`

```python
from django.contrib import admin

from .models import StoreProvince, Store, UserStore


@admin.register(StoreProvince)
class StoreProvinceAdmin(admin.ModelAdmin):
    list_display = (
        "province_id",
        "province_name",
        "center_lng",
        "center_lat",
    )

    search_fields = (
        "province_name",
    )


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = (
        "store_id",
        "store_name",
        "store_type",
        "province",
        "city",
        "district",
        "store_phone",
        "is_operating",
    )

    search_fields = (
        "store_name",
        "province_name",
        "city",
        "district",
        "address",
    )

    list_filter = (
        "store_type",
        "is_operating",
        "province",
    )


@admin.register(UserStore)
class UserStoreAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "role",
        "store",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__real_name",
        "store__store_name",
        "role__role_name",
    )

    list_filter = (
        "role",
        "store",
    )
```

**要点**：

- **要点**：store 从 `rbac.models` 导入 `SysUser`、`SysRole` 建立跨应用外键。
- **要点**：门店与省份、用户门店关系均以 `on_delete=PROTECT` 防止误删被引用记录。
- **要点**：`y_user_store` 通过三个复合索引支撑「按用户查门店」「按用户+门店」「按用户+角色+门店」查询。

---

## 5. course 模块

course 负责四张表：

| 表名 | 说明 |
|------|------|
| `t_course_category` | 课程分类表 |
| `t_course` | 课程表 |
| `y_user_course_favorite` | 用户收藏课程表 |
| `t_store_course_schedule` | 门店课程排期表 |

### 5.1 `backend/course/models.py`

```python
from django.db import models

from rbac.models import SysUser
from store.models import Store


class CourseCategory(models.Model):
    """
    课程分类表
    对应 MySQL 表：t_course_category
    """

    STATUS_CHOICES = (
        (1, "启用"),
        (0, "禁用"),
    )

    category_id = models.BigAutoField(
        primary_key=True,
        verbose_name="分类ID"
    )

    category_name = models.CharField(
        max_length=64,
        verbose_name="分类名称"
    )

    category_url = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="分类图片URL"
    )

    description = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name="分类描述"
    )

    status = models.IntegerField(
        default=1,
        choices=STATUS_CHOICES,
        verbose_name="状态"
    )

    class Meta:
        db_table = "t_course_category"
        verbose_name = "课程分类"
        verbose_name_plural = "课程分类"

    def __str__(self):
        return self.category_name


class Course(models.Model):
    """
    健身课程主数据表
    对应 MySQL 表：t_course
    """

    STATUS_CHOICES = (
        (1, "启用"),
        (0, "禁用"),
    )

    course_id = models.BigAutoField(
        primary_key=True,
        verbose_name="课程ID"
    )

    course_name = models.CharField(
        max_length=64,
        verbose_name="课程名称"
    )

    category = models.ForeignKey(
        CourseCategory,
        on_delete=models.PROTECT,
        db_column="category_id",
        related_name="courses",
        verbose_name="课程分类ID"
    )

    course_difficulty = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="课程难度"
    )

    duration_minutes = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="课程时长(分钟)"
    )

    max_participants = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="最大参与人数"
    )

    schedule_info = models.TextField(
        null=True,
        blank=True,
        verbose_name="排期信息"
    )

    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="课程详细描述"
    )

    status = models.IntegerField(
        default=1,
        choices=STATUS_CHOICES,
        verbose_name="状态"
    )

    class Meta:
        db_table = "t_course"
        verbose_name = "健身课程"
        verbose_name_plural = "健身课程"

    def __str__(self):
        return self.course_name


class UserCourseFavorite(models.Model):
    """
    用户收藏课程表
    对应 MySQL 表：y_user_course_favorite
    """

    favorite_id = models.BigAutoField(
        primary_key=True,
        verbose_name="收藏记录ID"
    )

    user = models.ForeignKey(
        SysUser,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="course_favorites",
        verbose_name="用户ID"
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        db_column="course_id",
        related_name="user_favorites",
        verbose_name="课程ID"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="收藏时间"
    )

    class Meta:
        db_table = "y_user_course_favorite"
        verbose_name = "用户收藏课程"
        verbose_name_plural = "用户收藏课程"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course"],
                name="uk_user_course"
            )
        ]

    def __str__(self):
        return f"{self.user.username} 收藏 {self.course.course_name}"


class StoreCourseSchedule(models.Model):
    """
    门店课程排期表
    对应 MySQL 表：t_store_course_schedule
    """

    STATUS_CHOICES = (
        (1, "正常"),
        (0, "取消"),
    )

    schedule_id = models.BigAutoField(
        primary_key=True,
        verbose_name="排期ID"
    )

    store = models.ForeignKey(
        Store,
        on_delete=models.PROTECT,
        db_column="store_id",
        related_name="course_schedules",
        verbose_name="所属门店ID"
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        db_column="course_id",
        related_name="store_schedules",
        verbose_name="课程ID"
    )

    coach = models.ForeignKey(
        SysUser,
        on_delete=models.SET_NULL,
        db_column="coach_id",
        related_name="coach_schedules",
        null=True,
        blank=True,
        verbose_name="教练用户ID"
    )

    course_date = models.DateField(
        verbose_name="上课日期"
    )

    start_time = models.DateTimeField(
        verbose_name="开始时间"
    )

    classroom_name = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="教室名称"
    )

    status = models.IntegerField(
        default=1,
        choices=STATUS_CHOICES,
        verbose_name="状态"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="创建时间"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="更新时间"
    )

    class Meta:
        db_table = "t_store_course_schedule"
        verbose_name = "门店课程排期"
        verbose_name_plural = "门店课程排期"
        indexes = [
            models.Index(fields=["store", "course_date"], name="idx_store_date"),
            models.Index(fields=["course", "start_time"], name="idx_course_time"),
        ]

    def __str__(self):
        return f"{self.store.store_name} - {self.course.course_name} - {self.course_date}"
```

### 5.2 course 模型字段说明

CourseCategory（`t_course_category`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `category_id` | BigAutoField | 主键 | 分类 ID |
| `category_name` | CharField(64) | 必填 | 分类名称 |
| `category_url` | CharField(255) | null、blank | 分类图片 URL |
| `description` | CharField(500) | null、blank | 分类描述 |
| `status` | IntegerField | default=1、choices=STATUS_CHOICES | 状态（1 启用 / 0 禁用） |

Course（`t_course`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `course_id` | BigAutoField | 主键 | 课程 ID |
| `course_name` | CharField(64) | 必填 | 课程名称 |
| `category` | ForeignKey(CourseCategory) | PROTECT、`db_column="category_id"` | 所属分类 |
| `course_difficulty` | IntegerField | null、blank | 课程难度 |
| `duration_minutes` | IntegerField | null、blank | 课程时长（分钟） |
| `max_participants` | IntegerField | null、blank | 最大参与人数 |
| `schedule_info` | TextField | null、blank | 排期信息 |
| `description` | TextField | null、blank | 课程详细描述 |
| `status` | IntegerField | default=1、choices | 状态 |

UserCourseFavorite（`y_user_course_favorite`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `favorite_id` | BigAutoField | 主键 | 收藏记录 ID |
| `user` | ForeignKey(SysUser) | CASCADE、`db_column="user_id"` | 收藏用户 |
| `course` | ForeignKey(Course) | CASCADE、`db_column="course_id"` | 被收藏课程 |
| `created_at` | DateTimeField | auto_now_add | 收藏时间 |

唯一约束：`uk_user_course`(user, course)，同一用户对同一课程仅一条收藏。

StoreCourseSchedule（`t_store_course_schedule`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `schedule_id` | BigAutoField | 主键 | 排期 ID |
| `store` | ForeignKey(Store) | PROTECT、`db_column="store_id"` | 所属门店 |
| `course` | ForeignKey(Course) | PROTECT、`db_column="course_id"` | 排期课程 |
| `coach` | ForeignKey(SysUser) | SET_NULL、null、blank、`db_column="coach_id"` | 教练用户 |
| `course_date` | DateField | 必填 | 上课日期 |
| `start_time` | DateTimeField | 必填 | 开始时间 |
| `classroom_name` | CharField(64) | null、blank | 教室名称 |
| `status` | IntegerField | default=1、choices | 状态（1 正常 / 0 取消） |
| `created_at` | DateTimeField | auto_now_add | 创建时间 |
| `updated_at` | DateTimeField | auto_now | 更新时间 |

索引：`idx_store_date`(store, course_date)、`idx_course_time`(course, start_time)。

### 5.3 `backend/course/admin.py`

```python
from django.contrib import admin

from .models import (
    CourseCategory,
    Course,
    UserCourseFavorite,
    StoreCourseSchedule,
)


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "category_id",
        "category_name",
        "status",
    )

    search_fields = (
        "category_name",
    )

    list_filter = (
        "status",
    )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "course_id",
        "course_name",
        "category",
        "course_difficulty",
        "duration_minutes",
        "max_participants",
        "status",
    )

    search_fields = (
        "course_name",
        "description",
    )

    list_filter = (
        "category",
        "course_difficulty",
        "status",
    )


@admin.register(UserCourseFavorite)
class UserCourseFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        "favorite_id",
        "user",
        "course",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__real_name",
        "course__course_name",
    )

    list_filter = (
        "course",
    )


@admin.register(StoreCourseSchedule)
class StoreCourseScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "schedule_id",
        "store",
        "course",
        "coach",
        "course_date",
        "start_time",
        "classroom_name",
        "status",
    )

    search_fields = (
        "store__store_name",
        "course__course_name",
        "coach__username",
        "classroom_name",
    )

    list_filter = (
        "store",
        "course",
        "course_date",
        "status",
    )
```

**要点**：

- **要点**：course 从 `store.models` 导入 `Store`，排期表跨应用引用门店。
- **要点**：收藏表用 `on_delete=CASCADE`，用户或课程删除时收藏随之删除；排期表用 `PROTECT`，教练用 `SET_NULL`。
- **要点**：`uk_user_course` 唯一约束防止重复收藏同一课程。

---

## 6. exercise 模块

exercise 负责三张表：

| 表名 | 说明 |
|------|------|
| `t_action_category` | 动作分类表 |
| `t_action` | 动作库条目表 |
| `y_user_action_favorite` | 用户动作收藏表 |

### 6.1 `backend/exercise/models.py`

```python
from django.db import models

from rbac.models import SysUser


class ActionCategory(models.Model):
    """
    动作分类表
    对应 MySQL 表：t_action_category
    """

    category_id = models.BigAutoField(
        primary_key=True,
        verbose_name="分类ID"
    )

    category_name = models.CharField(
        max_length=64,
        verbose_name="分类名称"
    )

    category_image_url = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="分类图标/图片"
    )

    class Meta:
        db_table = "t_action_category"
        verbose_name = "动作分类"
        verbose_name_plural = "动作分类"

    def __str__(self):
        return self.category_name


class Action(models.Model):
    """
    动作库条目表
    对应 MySQL 表：t_action
    """

    STORE_TYPE_CHOICES = (
        (1, "铁馆"),
        (2, "商业私教馆"),
    )

    action_id = models.BigAutoField(
        primary_key=True,
        verbose_name="动作ID"
    )

    action_name = models.CharField(
        max_length=64,
        verbose_name="动作名称"
    )

    category = models.ForeignKey(
        ActionCategory,
        on_delete=models.PROTECT,
        db_column="category_id",
        related_name="actions",
        verbose_name="动作分类ID"
    )

    action_difficulty = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="动作难度"
    )

    action_image_url = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="动作演示图/视频封面"
    )

    action_steps = models.TextField(
        null=True,
        blank=True,
        verbose_name="动作步骤文案"
    )

    attention_points = models.TextField(
        null=True,
        blank=True,
        verbose_name="注意事项"
    )

    applicable_equipment = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="适用器械"
    )

    applicable_store_type = models.IntegerField(
        null=True,
        blank=True,
        choices=STORE_TYPE_CHOICES,
        verbose_name="适用门店类型"
    )

    class Meta:
        db_table = "t_action"
        verbose_name = "动作"
        verbose_name_plural = "动作"

    def __str__(self):
        return self.action_name


class UserActionFavorite(models.Model):
    """
    用户动作收藏表
    对应 MySQL 表：y_user_action_favorite
    """

    favorite_id = models.BigAutoField(
        primary_key=True,
        verbose_name="收藏记录ID"
    )

    user = models.ForeignKey(
        SysUser,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="action_favorites",
        verbose_name="用户ID"
    )

    action = models.ForeignKey(
        Action,
        on_delete=models.CASCADE,
        db_column="action_id",
        related_name="user_favorites",
        verbose_name="动作ID"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="收藏时间"
    )

    class Meta:
        db_table = "y_user_action_favorite"
        verbose_name = "用户动作收藏"
        verbose_name_plural = "用户动作收藏"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "action"],
                name="uk_user_action"
            )
        ]

    def __str__(self):
        return f"{self.user.username} 收藏 {self.action.action_name}"
```

### 6.2 exercise 模型字段说明

ActionCategory（`t_action_category`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `category_id` | BigAutoField | 主键 | 分类 ID |
| `category_name` | CharField(64) | 必填 | 分类名称 |
| `category_image_url` | CharField(255) | null、blank | 分类图标/图片 |

Action（`t_action`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `action_id` | BigAutoField | 主键 | 动作 ID |
| `action_name` | CharField(64) | 必填 | 动作名称 |
| `category` | ForeignKey(ActionCategory) | PROTECT、`db_column="category_id"` | 所属分类 |
| `action_difficulty` | IntegerField | null、blank | 动作难度 |
| `action_image_url` | CharField(255) | null、blank | 动作演示图/视频封面 |
| `action_steps` | TextField | null、blank | 动作步骤文案 |
| `attention_points` | TextField | null、blank | 注意事项 |
| `applicable_equipment` | CharField(255) | null、blank | 适用器械 |
| `applicable_store_type` | IntegerField | null、blank、choices=STORE_TYPE_CHOICES | 适用门店类型 |

UserActionFavorite（`y_user_action_favorite`）：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `favorite_id` | BigAutoField | 主键 | 收藏记录 ID |
| `user` | ForeignKey(SysUser) | CASCADE、`db_column="user_id"` | 收藏用户 |
| `action` | ForeignKey(Action) | CASCADE、`db_column="action_id"` | 被收藏动作 |
| `created_at` | DateTimeField | auto_now_add | 收藏时间 |

唯一约束：`uk_user_action`(user, action)，同一用户对同一动作仅一条收藏。

### 6.3 `backend/exercise/admin.py`

```python
from django.contrib import admin

from .models import (
    ActionCategory,
    Action,
    UserActionFavorite,
)


@admin.register(ActionCategory)
class ActionCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "category_id",
        "category_name",
        "category_image_url",
    )

    search_fields = (
        "category_name",
    )


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = (
        "action_id",
        "action_name",
        "category",
        "action_difficulty",
        "applicable_equipment",
        "applicable_store_type",
    )

    search_fields = (
        "action_name",
        "action_steps",
        "attention_points",
        "applicable_equipment",
    )

    list_filter = (
        "category",
        "action_difficulty",
        "applicable_store_type",
    )


@admin.register(UserActionFavorite)
class UserActionFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        "favorite_id",
        "user",
        "action",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__real_name",
        "action__action_name",
    )

    list_filter = (
        "action",
    )
```

**要点**：

- **要点**：动作收藏表结构与课程收藏表一致，均以 `CASCADE` + 唯一约束实现「一人一物一收藏」。
- **要点**：`applicable_store_type` 复用门店类型枚举，标记动作适用的门店形态。

---

## 7. 生成并执行迁移

确认位于 `rbac_project/backend`，分应用生成迁移：

```bash
python manage.py makemigrations store
python manage.py makemigrations course
python manage.py makemigrations exercise
```

无报错后再执行迁移：

```bash
python manage.py migrate
```

成功后 MySQL 新增以下 10 张业务表：

```text
t_store_province
t_store
y_user_store

t_course_category
t_course
y_user_course_favorite
t_store_course_schedule

t_action_category
t_action
y_user_action_favorite
```

**要点**：

- **要点**：三个 app 分别 `makemigrations`，报错时可快速定位归属应用。
- **要点**：`migrate` 一次性落库全部迁移，新增 10 张业务表。

---

## 8. 检查 MySQL 表

进入 MySQL 并选择数据库：

```bash
mysql -u root -p
```

```sql
USE rbac_db;
```

查看全部表：

```sql
SHOW TABLES;
```

结果中应出现新增的 10 张业务表。也可逐表查看结构：

```sql
DESC t_store_province;
DESC t_store;
DESC y_user_store;

DESC t_course_category;
DESC t_course;
DESC y_user_course_favorite;
DESC t_store_course_schedule;

DESC t_action_category;
DESC t_action;
DESC y_user_action_favorite;
```

查看完成后退出：

```sql
exit;
```

**要点**：

- **要点**：`SHOW TABLES` 核对数量，`DESC` 核对列结构。
- **要点**：所有表名与模型 `Meta.db_table` 严格一致。

---

## 9. 启动后台检查 Admin

启动 Django：

```bash
python manage.py runserver
```

访问：

```text
http://127.0.0.1:8000/admin/
```

应能看到以下模块：

```text
门店省份/区域
门店
用户门店关系

课程分类
健身课程
用户收藏课程
门店课程排期

动作分类
动作
用户动作收藏
```

**要点**：

- **要点**：Admin 中模块按 app 分组展示，中文名取自 `verbose_name`。
- **要点**：可见模块即代表模型注册成功，可后台增删改查基础数据。

---

## 10. 阶段完成标准与模块职责

### 10.1 完成标准

需逐项确认：

1. `backend/store` app 创建成功
2. `backend/course` app 创建成功
3. `backend/exercise` app 创建成功
4. `settings.py` 已注册 store、course、exercise
5. 三个 app 的 `models.py` 已写好
6. 三个 app 的 `admin.py` 已注册模型
7. `makemigrations` 成功
8. `migrate` 成功
9. MySQL 中新增 10 张表
10. Django Admin 后台能看到这些模块

### 10.2 当前项目模块职责

| 模块 | 职责 |
|------|------|
| `rbac/` | 用户、角色、权限、登录、JWT、RBAC 权限判断 |
| `store/` | 省份/区域、门店信息、用户和门店关系 |
| `course/` | 课程分类、课程主数据、用户课程收藏、门店课程排期 |
| `exercise/` | 动作分类、动作库、用户动作收藏 |

**要点**：

- **要点**：完成标准覆盖 app 创建、注册、模型、迁移、建表、后台六个层次。
- **要点**：rbac 承担权限与身份，业务三域各归其 app。

---

## 阶段小结

| 环节 | 核心操作 | 结果 |
|------|----------|------|
| 结构拆分 | startapp 三个业务 app | 权限域与业务域分离 |
| app 注册 | settings.py 加入 store/course/exercise | 应用纳入项目 |
| store 模型 | 省份、门店、用户门店关系三表 | 含跨应用外键与复合索引 |
| course 模型 | 分类、课程、收藏、排期四表 | 含唯一约束与跨应用引用 |
| exercise 模型 | 分类、动作、收藏三表 | 与课程收藏结构对称 |
| Admin 注册 | 各 app admin.py 注册模型 | 后台可管理业务数据 |
| 迁移建表 | makemigrations + migrate | MySQL 新增 10 张表 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| `makemigrations` 提示无变更 | app 未加入 `INSTALLED_APPS` | 在 settings.py 注册 store/course/exercise |
| 迁移报跨应用外键错误 | 被引用模型所在 app 未注册或未先建表 | 确保 rbac、store 先于引用方迁移 |
| `migrate` 报唯一约束冲突 | 已有数据违反 `uk_user_course`/`uk_user_action` | 清理重复收藏记录后重新迁移 |
| Admin 缺少某业务模块 | 对应模型未在 `admin.py` 注册 | 补充 `@admin.register` 与 Admin 类 |
| MySQL 表数量不足 10 | 仅 `makemigrations` 未 `migrate` | 补执行 `python manage.py migrate` |
| `SHOW TABLES` 无新表 | 使用了错误的数据库 | 确认已 `USE rbac_db;` |

---

## 下一阶段衔接

阶段 12 完成了三大业务域的模型与数据表搭建，但表内尚无数据。阶段 13（`阶段 13：初始化门店、课程、动作测试数据.md`）将向这些表灌入测试用的省份、门店、课程分类、课程、课程排期、动作分类与动作数据，使后续的查询接口具备可验证的数据基础。
