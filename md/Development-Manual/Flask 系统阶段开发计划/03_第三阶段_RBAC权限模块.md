# 第 3 阶段：RBAC 权限模块

本阶段基于第 2 阶段登录认证继续开发，实现角色管理、权限管理、角色分配权限、`permission_required` 装饰器，以及后台菜单按权限展示。

完成本阶段后：

- 登录用户必须具备对应权限才能访问后台功能。
- 超级管理员默认拥有全部权限。
- 后台菜单根据权限动态显示。
- 角色可以绑定多个权限。

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

---

## 3. 注册权限上下文和 403 页面

修改文件：`app/__init__.py` 中的 `register_template_context` 和 `register_error_handlers`。

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

```powershell
flask init-permissions
```

---

## 5. 注册 RBAC 路由模块

修改文件：`app/blueprints/admin/__init__.py`

```python
from flask import Blueprint


admin_bp = Blueprint("admin", __name__)

from . import routes
from . import rbac_routes
```

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

注意：第 4 阶段之后才会逐步创建 `admin.users`、`admin.stores` 等端点，所以第 3 阶段先把未来模块保留为 `#`，后续阶段再替换成真实 `url_for`。

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

---

## 12. 本阶段验证

```powershell
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

| 检查项 | 预期结果 |
| --- | --- |
| 超级管理员访问 RBAC 页面 | 可以访问 |
| 普通角色没有权限 | 返回 403 |
| 给角色分配权限 | 保存成功 |
| 后台菜单 | 根据权限动态显示 |

---

## 13. 下一阶段衔接

第 4 阶段将在 RBAC 基础上继续开发：

- 用户管理。
- 用户档案管理。
- 省份/区域管理。
- 门店管理。
- 用户绑定门店。
