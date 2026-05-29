你这一步的后端结构目标是：

```latex
backend/
├── rbac/          # 用户、角色、权限、登录、JWT
├── store/         # 省份、门店、用户门店关系
├── course/        # 课程分类、课程、用户收藏课程、门店课程排期
└── exercise/      # 动作分类、动作、用户收藏动作
```

你上传的 SQL 里包含了门店、省份、用户门店关系、课程分类、课程、课程收藏、门店课程排期、动作分类、动作、动作收藏这些表。

本阶段只做：

```latex
1. 创建 store / course / exercise 三个 app
2. 配置 settings.py
3. 编写 models.py
4. 注册 admin.py
5. 生成迁移并创建 MySQL 表
```

暂时不做：

```latex
接口
Vue 页面
权限菜单
收藏功能逻辑
```

---

# 一、创建三个 Django app
确认你在：

```latex
rbac_project/backend
```

执行：

```bash
python manage.py startapp store
python manage.py startapp course
python manage.py startapp exercise
```

创建后目录应该变成：

```latex
backend/
├── rbac/
├── store/
├── course/
└── exercise/
```

---

# 二、注册 app
打开：

```latex
backend/config/settings.py
```

找到：

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

---

# 三、store 模块
store 负责三张表：

```latex
t_store_province   省份/区域表
t_store            门店表
y_user_store       用户门店关系表
```

---

## 1. `backend/store/models.py`
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

---

## 2. `backend/store/admin.py`
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

---

# 四、course 模块
course 负责四张表：

```latex
t_course_category          课程分类表
t_course                   课程表
y_user_course_favorite     用户收藏课程表
t_store_course_schedule    门店课程排期表
```

---

## 1. `backend/course/models.py`
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

---

## 2. `backend/course/admin.py`
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

---

# 五、exercise 模块
exercise 负责三张表：

```latex
t_action_category        动作分类表
t_action                 动作库条目表
y_user_action_favorite   用户动作收藏表
```

---

## 1. `backend/exercise/models.py`
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

---

## 2. `backend/exercise/admin.py`
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

---

# 六、生成迁移文件
确认你在：

```latex
rbac_project/backend
```

执行：

```bash
python manage.py makemigrations store
python manage.py makemigrations course
python manage.py makemigrations exercise
```

如果没有报错，再执行：

```bash
python manage.py migrate
```

成功后，MySQL 会新增这些表：

```latex
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

---

# 七、检查 MySQL 表
进入 MySQL：

```bash
mysql -u root -p
```

选择数据库：

```sql
USE rbac_db;
```

查看表：

```sql
SHOW TABLES;
```

你应该能看到新增的 10 张业务表。

也可以分别查看：

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

退出：

```sql
exit;
```

---

# 八、启动后台检查 Admin
启动 Django：

```bash
python manage.py runserver
```

访问：

```latex
http://127.0.0.1:8000/admin/
```

你应该可以看到这些模块：

```latex
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

---

# 九、阶段 12 完成标准
你需要确认：

```latex
1. backend/store app 创建成功
2. backend/course app 创建成功
3. backend/exercise app 创建成功
4. settings.py 已注册 store、course、exercise
5. 三个 app 的 models.py 已写好
6. 三个 app 的 admin.py 已注册模型
7. makemigrations 成功
8. migrate 成功
9. MySQL 中新增 10 张表
10. Django Admin 后台能看到这些模块
```

---

# 十、当前项目模块职责
现在项目结构更清晰了：

```latex
rbac/
负责：
- 用户
- 角色
- 权限
- 登录
- JWT
- RBAC 权限判断

store/
负责：
- 省份/区域
- 门店信息
- 用户和门店关系

course/
负责：
- 课程分类
- 课程主数据
- 用户课程收藏
- 门店课程排期

exercise/
负责：
- 动作分类
- 动作库
- 用户动作收藏
```

到这里，**阶段 12：拆分业务模块并创建 store / course / exercise 数据表**完成。

下一阶段建议做：

```latex
阶段 13：初始化门店、课程、动作测试数据
```

也就是创建一些测试用的：

```latex
省份
门店
课程分类
课程
课程排期
动作分类
动作
```

