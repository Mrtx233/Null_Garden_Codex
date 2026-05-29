## 1.1 项目名称
我们统一使用这个项目名：

```plain
rbac_project
rbac_project/
└── backend/
    ├── manage.py
    └── config/
        ├── settings.py
        ├── urls.py
        ├── asgi.py
        └── wsgi.py
rbac_project 是总项目文件夹
backend 是 Django 后端文件夹
config 是 Django 的配置目录
```

---

## 1.2 安装当前阶段需要的包
```plain
pip install django mysqlclient
```

如果你是 Windows，`mysqlclient` 安装失败，可以先用：

```plain
pip install pymysql
```

不过优先推荐先试 `mysqlclient`。

---

## 1.3 创建 Django 项目
```plain
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

---

## 1.4 创建 MySQL 数据库
```plain
mysql -u root -p
CREATE DATABASE rbac_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
exit;
```

---

## 1.5 修改 Django 配置连接 MySQL
```plain
backend/config/settings.py
```

找到原来的 `DATABASES`：

把它改成：

```plain
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

---

## 1.6 修改语言和时区
还是在：

```plain
backend/config/settings.py
```

找到：

```plain
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"
```

改成：

```plain
LANGUAGE_CODE = "zh-hans"

TIME_ZONE = "Asia/Shanghai"
```

---

## 1.7 测试数据库连接
执行：

```plain
python manage.py migrate
```

这一步的作用是：

```plain
让 Django 创建它自己默认需要的表。
```

如果成功，你会看到类似：

```plain
Applying contenttypes.0001_initial... OK
Applying auth.0001_initial... OK
Applying admin.0001_initial... OK
Applying sessions.0001_initial... OK
```

然后你的 MySQL 数据库 `rbac_db` 里会多出一些 Django 默认表。

---

## 1.8 启动 Django 项目
执行：

```plain
python manage.py runserver
```

浏览器访问：

```plain
http://127.0.0.1:8000/
```

如果看到 Django 的欢迎页面，说明阶段 1 成功。

---

