# 第三阶段：RBAC 权限模块

> **合辑**：Flask 系统阶段开发手册 ｜ **阶段**：3 / 8 ｜ **定位**：基于登录认证实现角色—权限建模、`permission_required` 装饰器与后台菜单按权限动态展示 ｜ **建议学时**：6–8 小时

大家好，我是小马不起床。

## 阶段导语

本阶段在第 2 阶段登录认证模块的基础上继续开发，引入基于角色的访问控制（RBAC, Role-Based Access Control）机制。实现范围包括角色管理、权限管理、角色分配权限、以装饰器（Decorator）形式提供的 `permission_required` 权限拦截，以及后台菜单按权限动态展示。

完成后，登录用户必须持有对应权限方可访问后台功能，超级管理员默认拥有全部权限，角色可绑定多个权限，后台导航依据当前用户权限动态渲染。

## 学习目标

- [ ] 说明用户、角色、权限三者在 RBAC 模型中的关联关系
- [ ] 编写 `permission_required` 装饰器，实现视图级权限拦截与 403 响应
- [ ] 通过 `init-permissions` 命令初始化权限数据并为超级管理员绑定全部权限
- [ ] 实现角色与权限的管理路由及列表、表单、分配权限模板
- [ ] 使用上下文处理器（Context Processor）向模板注入 `has_permission`，实现后台菜单按权限动态展示

## 前置知识

本阶段依赖第 2 阶段（[第二阶段：登录认证模块](02_第二阶段_登录认证模块.md)）的成果：

| 前置条目 | 具体要求 |
| --- | --- |
| RBAC 数据模型 | `app/models.py` 中已定义 User、Role、Permission、RolePermission 模型 |
| 登录状态 | 第 2 阶段已实现 Session 登录，`session["user_id"]` 可读取 |
| 权限工具 | `app/utils/auth.py` 中已存在 `get_current_user`、`login_required` |
| 管理员数据 | `flask init-admin` 已创建 `role_code` 为 admin 的超级管理员 |

若上述内容尚不熟悉，建议先完成 [第二阶段：登录认证模块](02_第二阶段_登录认证模块.md)。

## 目录

1. [阶段导语](#阶段导语)
2. [学习目标](#学习目标)
3. [前置知识](#前置知识)
4. [本阶段新增和修改文件](#1-本阶段新增和修改文件)
5. [权限工具函数](#2-权限工具函数)
6. [注册权限上下文和 403 页面](#3-注册权限上下文和-403-页面)
7. [权限初始化命令](#4-权限初始化命令)
8. [注册 RBAC 路由模块](#5-注册-rbac-路由模块)
9. [控制台增加权限保护](#6-控制台增加权限保护)
10. [角色和权限管理路由](#7-角色和权限管理路由)
11. [后台菜单按权限展示](#8-后台菜单按权限展示)
12. [角色列表模板](#9-角色列表模板)
13. [权限模板](#10-权限模板)
14. [后台表格和表单样式](#11-后台表格和表单样式)
15. [本阶段验证](#12-本阶段验证)
16. [阶段小结](#阶段小结)
17. [常见问题与排查](#常见问题与排查)
18. [下一阶段衔接](#下一阶段衔接)

---

## 1. 本阶段新增和修改文件

| 类型 | 文件 |
| --- | --- |
| 修改 | `app/utils/auth.py` |
| 修改 | `app/commands.py` |
| 修改 | `app/blueprints/admin/__init__.py` |
| 新增 | `app/blueprints/admin/rbac_routes.py` |
| 修改 | `app/blueprints/admin/routes.py` |
| 修改 | `app/templates/admin/layout.html` |
| 新增 | `app/templates/admin/roles.html` |
| 新增 | `app/templates/admin/role_form.html` |
| 新增 | `app/templates/admin/permissions.html` |
| 新增 | `app/templates/admin/role_permissions.html` |

- **要点**：本阶段新增 4 个文件、修改 6 个文件，改动集中在 RBAC 路由、权限工具与模板。
- **要点**：`rbac_routes.py` 与四个 RBAC 模板为本阶段新增的独立模块，与既有 `routes.py` 解耦。

---

## 2. 权限工具函数

修改文件：`app/utils/auth.py`

```python
from functools import wraps

from flask import abort, flash, redirect, request, session, url_for

from app.models import Permission, RolePermission, User


def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def login_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            flash("请先登录后再访问后台。", "warning")
            return redirect(url_for("auth.login", next=request.full_path))
        if not user.is_active:
            session.clear()
            flash("当前账号已被禁用。", "danger")
            return redirect(url_for("auth.login"))
        return view_func(*args, **kwargs)

    return wrapper


def get_user_permission_codes(user):
    if not user or not user.role:
        return set()

    if user.role.role_code == "admin":
        return {item.permission_code for item in Permission.query.all()}

    rows = (
        RolePermission.query
        .join(Permission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == user.role_id)
        .all()
    )
    return {item.permission.permission_code for item in rows}


def has_permission(code):
    user = get_current_user()
    if not user:
        return False
    if user.role and user.role.role_code == "admin":
        return True
    return code in get_user_permission_codes(user)


def permission_required(code):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapper(*args, **kwargs):
            if not has_permission(code):
                abort(403)
            return view_func(*args, **kwargs)

        return wrapper

    return decorator
```

- **要点**：`get_user_permission_codes` 对超级管理员直接返回全部权限码，普通角色走 RolePermission 联表查询。
- **要点**：`has_permission` 在超级管理员处短路返回 True，其余按权限码集合判断。
- **要点**：`permission_required` 叠加 `login_required`，未登录先跳转登录页，越权则 `abort(403)`。

---

## 3. 注册权限上下文和 403 页面

修改文件：`app/__init__.py` 中的 `register_template_context` 和 `register_error_handlers`。此处通过上下文处理器（Context Processor）向所有模板注入权限判断能力。

```python
def register_template_context(app):
    from .utils.auth import get_current_user, has_permission

    @app.context_processor
    def inject_current_user():
        return {
            "current_user": get_current_user(),
            "has_permission": has_permission,
        }


def register_error_handlers(app):
    @app.errorhandler(403)
    def forbidden(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def page_not_found(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return render_template("errors/500.html"), 500
```

新增文件：`app/templates/errors/403.html`

```html
<!doctype html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>无权访问</title>
</head>
<body>
    <h1>403</h1>
    <p>你没有权限访问该页面。</p>
    <a href="{{ url_for('admin.dashboard') }}">返回后台首页</a>
</body>
</html>
```

- **要点**：上下文处理器通过 `@app.context_processor` 向所有模板注入 `current_user` 与 `has_permission`。
- **要点**：`register_error_handlers` 新增 403 处理，渲染 `errors/403.html` 并返回状态码 403。
- **要点**：403 页面为独立交付物，页面文案与回跳链接保持原样。

---

## 4. 权限初始化命令

修改文件：`app/commands.py`

```python
import click
from flask.cli import with_appcontext

from app.extensions import db
from app.models import Permission, Role, RolePermission, User, UserProfile


PERMISSIONS = [
    ("dashboard:view", "查看控制台", "/admin/"),
    ("rbac:manage", "角色权限管理", "/admin/roles"),
    ("user:manage", "用户管理", "/admin/users"),
    ("store:manage", "门店管理", "/admin/stores"),
    ("course:manage", "课程管理", "/admin/courses"),
    ("action:manage", "动作库管理", "/admin/actions"),
    ("activity:manage", "活动配置管理", "/admin/activities"),
    ("forum:manage", "论坛管理", "/admin/forum/posts"),
]


def register_cli_commands(app):
    app.cli.add_command(init_admin)
    app.cli.add_command(init_permissions)


@click.command("init-admin")
@click.option("--username", default="admin", help="管理员用户名")
@click.option("--password", default="123456", help="管理员密码")
@with_appcontext
def init_admin(username, password):
    admin_role = Role.query.filter_by(role_code="admin").first()
    if not admin_role:
        admin_role = Role(role_code="admin", role_name="超级管理员")
        db.session.add(admin_role)
        db.session.flush()

    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(role_id=admin_role.id, username=username, real_name="系统管理员", status=1)
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id))
    else:
        user.role_id = admin_role.id
        user.status = 1
        user.set_password(password)

    db.session.commit()
    click.echo("管理员初始化完成。")


@click.command("init-permissions")
@with_appcontext
def init_permissions():
    admin_role = Role.query.filter_by(role_code="admin").first()
    if not admin_role:
        admin_role = Role(role_code="admin", role_name="超级管理员")
        db.session.add(admin_role)
        db.session.flush()

    for code, name, path in PERMISSIONS:
        permission = Permission.query.filter_by(permission_code=code).first()
        if not permission:
            permission = Permission(permission_code=code, permission_name=name, menu_path=path)
            db.session.add(permission)
            db.session.flush()

        exists = RolePermission.query.filter_by(role_id=admin_role.id, permission_id=permission.id).first()
        if not exists:
            db.session.add(RolePermission(role_id=admin_role.id, permission_id=permission.id))

    db.session.commit()
    click.echo("权限初始化完成。")
```

执行：

```bash
flask init-permissions
```

- **要点**：`PERMISSIONS` 列表以"权限码—名称—菜单路径"三元组集中声明系统全部权限。
- **要点**：`init-permissions` 幂等地创建权限记录，并为 admin 角色补齐 RolePermission 关联。
- **要点**：命令通过 `register_cli_commands` 注册，执行 `flask init-permissions` 后生效。

---

## 5. 注册 RBAC 路由模块

修改文件：`app/blueprints/admin/__init__.py`

```python
from flask import Blueprint


admin_bp = Blueprint("admin", __name__)

from . import routes
from . import rbac_routes
```

- **要点**：在 `admin/__init__.py` 末尾导入 `rbac_routes`，使其中注册的视图挂载到 `admin_bp`。
- **要点**：导入语句置于 Blueprint 定义之后，避免循环导入。

---

## 6. 控制台增加权限保护

修改文件：`app/blueprints/admin/routes.py`

```python
from flask import render_template

from app.utils.auth import permission_required
from . import admin_bp


@admin_bp.route("/")
@permission_required("dashboard:view")
def dashboard():
    return render_template("admin/dashboard.html")
```

- **要点**：dashboard 视图由 `login_required` 升级为 `permission_required("dashboard:view")`。
- **要点**：权限码 `dashboard:view` 与 PERMISSIONS 中的声明保持一致。

---

## 7. 角色和权限管理路由

文件：`app/blueprints/admin/rbac_routes.py`

```python
from flask import flash, redirect, render_template, request, url_for

from app.extensions import db
from app.models import Permission, Role, RolePermission
from app.utils.auth import permission_required
from . import admin_bp


@admin_bp.route("/roles")
@permission_required("rbac:manage")
def roles():
    items = Role.query.order_by(Role.id.desc()).all()
    return render_template("admin/roles.html", roles=items)


@admin_bp.route("/roles/create", methods=["GET", "POST"])
@permission_required("rbac:manage")
def role_create():
    if request.method == "POST":
        role = Role(
            role_code=request.form.get("role_code", "").strip(),
            role_name=request.form.get("role_name", "").strip(),
        )
        db.session.add(role)
        db.session.commit()
        flash("角色已创建。", "success")
        return redirect(url_for("admin.roles"))
    return render_template("admin/role_form.html", role=None)


@admin_bp.route("/roles/<int:role_id>/edit", methods=["GET", "POST"])
@permission_required("rbac:manage")
def role_edit(role_id):
    role = Role.query.get_or_404(role_id)
    if request.method == "POST":
        role.role_code = request.form.get("role_code", "").strip()
        role.role_name = request.form.get("role_name", "").strip()
        db.session.commit()
        flash("角色已更新。", "success")
        return redirect(url_for("admin.roles"))
    return render_template("admin/role_form.html", role=role)


@admin_bp.route("/permissions")
@permission_required("rbac:manage")
def permissions():
    items = Permission.query.order_by(Permission.id.desc()).all()
    return render_template("admin/permissions.html", permissions=items)


@admin_bp.route("/roles/<int:role_id>/permissions", methods=["GET", "POST"])
@permission_required("rbac:manage")
def role_permissions(role_id):
    role = Role.query.get_or_404(role_id)
    permissions = Permission.query.order_by(Permission.id.asc()).all()

    if request.method == "POST":
        selected_ids = {int(item) for item in request.form.getlist("permission_ids")}
        RolePermission.query.filter_by(role_id=role.id).delete()
        for permission_id in selected_ids:
            db.session.add(RolePermission(role_id=role.id, permission_id=permission_id))
        db.session.commit()
        flash("角色权限已保存。", "success")
        return redirect(url_for("admin.roles"))

    selected_ids = {
        item.permission_id
        for item in RolePermission.query.filter_by(role_id=role.id).all()
    }
    return render_template(
        "admin/role_permissions.html",
        role=role,
        permissions=permissions,
        selected_ids=selected_ids,
    )
```

- **要点**：五个视图统一使用 `@permission_required("rbac:manage")` 拦截，非授权角色访问返回 403。
- **要点**：`role_permissions` 先 `delete()` 清空旧关联，再按提交项重建 RolePermission。
- **要点**：角色与权限的创建、编辑均对表单字段 `strip()` 后写库。

---

## 8. 后台菜单按权限展示

修改文件：`app/templates/admin/layout.html` 中的菜单部分。

```html
<nav class="admin-menu">
    {% if has_permission("dashboard:view") %}
        <a href="{{ url_for('admin.dashboard') }}">控制台</a>
    {% endif %}
    {% if has_permission("rbac:manage") %}
        <a href="{{ url_for('admin.roles') }}">角色管理</a>
        <a href="{{ url_for('admin.permissions') }}">权限列表</a>
    {% endif %}
    {% if has_permission("store:manage") %}
        <a href="#">门店管理</a>
    {% endif %}
    {% if has_permission("course:manage") %}
        <a href="#">课程管理</a>
    {% endif %}
    {% if has_permission("action:manage") %}
        <a href="#">动作库</a>
    {% endif %}
    {% if has_permission("activity:manage") %}
        <a href="#">活动配置</a>
    {% endif %}
    {% if has_permission("forum:manage") %}
        <a href="#">论坛管理</a>
    {% endif %}
</nav>
```

说明：`admin.users`、`admin.stores` 等端点将在第 4 阶段及之后逐步创建，本阶段先把尚未实现模块的入口保留为 `#`，待后续阶段替换为真实的 `url_for` 调用。

- **要点**：菜单项通过模板中的 `has_permission("...")` 条件渲染，无权限的入口不输出。
- **要点**：超级管理员因 `has_permission` 短路而可见全部菜单。
- **要点**：尚未实现模块的入口暂以 `#` 占位，待后续阶段替换为真实端点。

---

## 9. 角色列表模板

文件：`app/templates/admin/roles.html`

```html
{% extends "admin/layout.html" %}

{% block title %}角色管理{% endblock %}
{% block page_name %}角色管理{% endblock %}

{% block content %}
<div class="toolbar">
    <a class="button" href="{{ url_for('admin.role_create') }}">新增角色</a>
</div>

<table class="data-table">
    <thead>
        <tr>
            <th>ID</th>
            <th>角色代码</th>
            <th>角色名称</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        {% for role in roles %}
            <tr>
                <td>{{ role.id }}</td>
                <td>{{ role.role_code }}</td>
                <td>{{ role.role_name }}</td>
                <td>
                    <a href="{{ url_for('admin.role_edit', role_id=role.id) }}">编辑</a>
                    <a href="{{ url_for('admin.role_permissions', role_id=role.id) }}">分配权限</a>
                </td>
            </tr>
        {% endfor %}
    </tbody>
</table>
{% endblock %}
```

文件：`app/templates/admin/role_form.html`

```html
{% extends "admin/layout.html" %}

{% block title %}{{ "编辑角色" if role else "新增角色" }}{% endblock %}
{% block page_name %}{{ "编辑角色" if role else "新增角色" }}{% endblock %}

{% block content %}
<form class="admin-form" method="post">
    <label>
        角色代码
        <input type="text" name="role_code" value="{{ role.role_code if role else '' }}" required>
    </label>
    <label>
        角色名称
        <input type="text" name="role_name" value="{{ role.role_name if role else '' }}" required>
    </label>
    <button type="submit">保存</button>
</form>
{% endblock %}
```

- **要点**：`roles.html` 以表格展示角色，并为每行提供编辑与分配权限入口。
- **要点**：`role_form.html` 依据 `role` 是否为空自动切换"新增 / 编辑"标题与回填值。

---

## 10. 权限模板

文件：`app/templates/admin/permissions.html`

```html
{% extends "admin/layout.html" %}

{% block title %}权限列表{% endblock %}
{% block page_name %}权限列表{% endblock %}

{% block content %}
<table class="data-table">
    <thead>
        <tr>
            <th>ID</th>
            <th>权限标识</th>
            <th>权限名称</th>
            <th>菜单路径</th>
        </tr>
    </thead>
    <tbody>
        {% for permission in permissions %}
            <tr>
                <td>{{ permission.id }}</td>
                <td>{{ permission.permission_code }}</td>
                <td>{{ permission.permission_name }}</td>
                <td>{{ permission.menu_path or "-" }}</td>
            </tr>
        {% endfor %}
    </tbody>
</table>
{% endblock %}
```

文件：`app/templates/admin/role_permissions.html`

```html
{% extends "admin/layout.html" %}

{% block title %}分配权限{% endblock %}
{% block page_name %}分配权限：{{ role.role_name }}{% endblock %}

{% block content %}
<form class="admin-form" method="post">
    <div class="checkbox-grid">
        {% for permission in permissions %}
            <label>
                <input
                    type="checkbox"
                    name="permission_ids"
                    value="{{ permission.id }}"
                    {% if permission.id in selected_ids %}checked{% endif %}
                >
                {{ permission.permission_name }}（{{ permission.permission_code }}）
            </label>
        {% endfor %}
    </div>
    <button type="submit">保存权限</button>
</form>
{% endblock %}
```

- **要点**：`permissions.html` 只读展示权限标识、名称与菜单路径。
- **要点**：`role_permissions.html` 以复选框列出全部权限，`selected_ids` 命中的项默认勾选。

---

## 11. 后台表格和表单样式

修改文件：`app/static/css/admin.css`

```css
.toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.button,
.admin-form button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    color: #ffffff;
    background: #0f766e;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: #ffffff;
    border: 1px solid #e5e7eb;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.data-table th {
    color: #374151;
    background: #f9fafb;
}

.data-table td a {
    margin-right: 10px;
    color: #0f766e;
}

.admin-form {
    display: grid;
    gap: 16px;
    max-width: 720px;
    padding: 20px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.admin-form label {
    display: grid;
    gap: 8px;
    color: #374151;
    font-size: 14px;
}

.admin-form input,
.admin-form select,
.admin-form textarea {
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
```

- **要点**：`admin.css` 提供 `.data-table`、`.admin-form`、`.checkbox-grid` 等 RBAC 页面通用样式。
- **要点**：`.button` 与表单提交按钮共用主色 `#0f766e`，保证后台视觉统一。

---

## 12. 本阶段验证

```bash
flask db upgrade
flask init-permissions
flask init-admin --username admin --password 123456
flask run
```

访问：

```text
角色管理：http://127.0.0.1:5000/admin/roles
权限列表：http://127.0.0.1:5000/admin/permissions
```

验收标准：

- [ ] 超级管理员访问 RBAC 页面可正常打开
- [ ] 普通角色越权访问返回 403
- [ ] 给角色分配权限后保存成功
- [ ] 后台菜单根据权限动态显示

- **要点**：验证前先执行 `flask db upgrade` 与 `flask init-permissions`，确保权限数据就绪。
- **要点**：验收覆盖超级管理员放行、普通角色 403、权限分配与菜单动态显示四条链路。

---

## 阶段小结

| 知识模块 | 核心要点 | 在权限体系中的作用 |
| --- | --- | --- |
| 权限工具函数 | `get_user_permission_codes`、`has_permission`、`permission_required` | 权限判断与视图拦截的执行内核 |
| 模板上下文 | 上下文处理器注入 `current_user`、`has_permission` | 供模板按权限渲染菜单 |
| 403 处理 | `errorhandler(403)` 渲染 `errors/403.html` | 越权访问的统一响应 |
| 权限初始化 | `init-permissions` 写入 PERMISSIONS 并绑定 admin | 建立权限数据基线 |
| RBAC 路由 | `rbac_routes.py` 提供角色与权限的增改查 | 后台 RBAC 管理入口 |
| 菜单展示 | `layout.html` 使用 `has_permission` 条件渲染 | 权限驱动的导航可见性 |

---

## 常见问题与排查

| 现象 | 原因 | 处理方式 |
| --- | --- | --- |
| 访问后台功能返回 403 | 当前用户所属角色未绑定对应权限 | 在角色分配权限页勾选该权限后保存 |
| 超级管理员仍无权限 | `role_code` 不为 admin，或权限数据未初始化 | 确认角色 `role_code` 为 admin 并执行 `flask init-permissions` |
| 后台菜单缺少某入口 | 模板 `has_permission` 判断的权限码与数据不一致 | 核对 `layout.html` 中的权限码与 Permission 记录 |
| 分配权限保存后未生效 | 未提交事务或用户未关联到该角色 | 检查 `db.session.commit` 与 `User.role_id` |
| `init-permissions` 命令无法识别 | 命令未在 `register_cli_commands` 中注册 | 确认 `app.cli.add_command(init_permissions)` 已调用 |

---

## 下一阶段衔接

本阶段完成后，系统具备完整的 RBAC 权限内核，后续业务模块将在此基础上以 `permission_required` 逐个接入。第 4 阶段（[第四阶段：用户与门店基础模块](04_第四阶段_用户与门店基础模块.md)）将在本阶段权限体系之上继续开发：

- 用户管理。
- 用户档案管理。
- 省份 / 区域管理。
- 门店管理。
- 用户绑定门店。
