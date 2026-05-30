# 03_后端登录认证与RBAC权限

## 一、阶段目标

本阶段目标是在第二阶段 ORM 模型和自动建表能力基础上，完成后端登录认证与 RBAC 权限控制。

完成本阶段后，后端应具备以下能力：

1. 自动初始化基础角色、权限、管理员账号。
2. 支持用户名密码登录。
3. 登录成功后签发 JWT Token。
4. 支持通过 Token 获取当前用户信息。
5. 支持通过 Token 获取当前用户权限和菜单。
6. 支持角色、权限、角色权限绑定管理。
7. 支持接口级权限校验。
8. 后续业务模块可以直接复用 `get_current_user` 和 `require_permission`。

## 二、本阶段开发顺序

```text
1. 扩展环境变量配置
2. 创建密码加密与 JWT 工具
3. 创建认证与权限 Schema
4. 创建初始化种子数据脚本
5. 修改数据库初始化流程，自动写入角色、权限、管理员
6. 创建认证 Service
7. 创建系统权限 Service
8. 创建认证依赖函数
9. 创建登录认证路由
10. 创建角色权限管理路由
11. 注册路由
12. 创建安全工具测试
13. 启动服务并验证登录流程
```

## 三、接口规划

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | 无 | 用户登录 |
| GET | `/api/auth/me` | 登录 | 当前用户信息 |
| GET | `/api/auth/permissions` | 登录 | 当前用户权限标识 |
| GET | `/api/auth/menus` | 登录 | 当前用户菜单 |
| GET | `/api/system/roles` | `role:list` | 角色列表 |
| POST | `/api/system/roles` | `role:create` | 创建角色 |
| PUT | `/api/system/roles/{role_id}` | `role:update` | 修改角色 |
| DELETE | `/api/system/roles/{role_id}` | `role:delete` | 删除角色 |
| GET | `/api/system/permissions` | `permission:list` | 权限列表 |
| PUT | `/api/system/roles/{role_id}/permissions` | `role:update` | 分配角色权限 |

## 四、本阶段文件清单

| 序号 | 相对路径 | 类型 | 说明 |
| --- | --- | --- | --- |
| 1 | `backend/.env` | 修改 | 增加默认管理员配置 |
| 2 | `backend/.env.example` | 修改 | 增加默认管理员配置 |
| 3 | `backend/app/core/config.py` | 修改 | 增加管理员初始化配置 |
| 4 | `backend/app/core/security.py` | 新增 | 密码加密、JWT 创建和解析 |
| 5 | `backend/app/schemas/auth.py` | 新增 | 登录、Token、当前用户响应结构 |
| 6 | `backend/app/schemas/system.py` | 新增 | 角色、权限、权限分配结构 |
| 7 | `backend/app/db/seed.py` | 新增 | 初始化角色、权限、管理员 |
| 8 | `backend/app/db/init_db.py` | 修改 | 自动建表后执行种子数据 |
| 9 | `backend/app/services/auth.py` | 新增 | 登录认证、用户权限、菜单 |
| 10 | `backend/app/services/system.py` | 新增 | 角色权限管理 |
| 11 | `backend/app/api/deps.py` | 新增 | 当前用户、权限依赖 |
| 12 | `backend/app/api/v1/auth.py` | 新增 | 登录认证接口 |
| 13 | `backend/app/api/v1/system.py` | 新增 | 角色权限管理接口 |
| 14 | `backend/app/api/router.py` | 修改 | 注册认证和系统路由 |
| 15 | `backend/tests/test_security.py` | 新增 | 密码和 Token 测试 |

## 五、步骤 1：扩展环境变量

### 要做什么

增加默认管理员账号和是否自动初始化数据的配置。

### 为什么做

当前你使用 ORM 自动建表，如果没有初始化角色、权限、管理员，登录接口没有账号可以登录。

### 相对路径

```text
backend/.env
```

### 完整示例

```env
APP_NAME=FastAPI_Vue3_JoyFit
APP_ENV=development
DEBUG=true
API_PREFIX=/api

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=FastAPI_Vue3_JoyFit
MYSQL_CHARSET=utf8mb4
SQLALCHEMY_ECHO=false
AUTO_CREATE_TABLES=true
AUTO_SEED_DATA=true

JWT_SECRET_KEY=please-change-this-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=123456
DEFAULT_ADMIN_REAL_NAME=系统管理员

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 相对路径

```text
backend/.env.example
```

### 完整代码

```env
APP_NAME=FastAPI_Vue3_JoyFit
APP_ENV=development
DEBUG=true
API_PREFIX=/api

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=FastAPI_Vue3_JoyFit
MYSQL_CHARSET=utf8mb4
SQLALCHEMY_ECHO=false
AUTO_CREATE_TABLES=true
AUTO_SEED_DATA=true

JWT_SECRET_KEY=please-change-this-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=123456
DEFAULT_ADMIN_REAL_NAME=系统管理员

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 注意事项

1. `DEFAULT_ADMIN_PASSWORD=123456` 只适合开发阶段。
2. 后续正式环境必须修改管理员初始密码和 JWT 密钥。
3. `.env` 不允许提交到 Git。

## 六、步骤 2：修改配置读取模块

### 要做什么

在配置类中增加自动初始化数据和默认管理员配置。

### 相对路径

```text
backend/app/core/config.py
```

### 完整代码

```python
from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "FastAPI_Vue3_JoyFit"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "FastAPI_Vue3_JoyFit"
    MYSQL_CHARSET: str = "utf8mb4"
    SQLALCHEMY_ECHO: bool = False
    AUTO_CREATE_TABLES: bool = True
    AUTO_SEED_DATA: bool = True

    JWT_SECRET_KEY: str = "please-change-this-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "123456"
    DEFAULT_ADMIN_REAL_NAME: str = "系统管理员"

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        password = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{password}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            f"?charset={self.MYSQL_CHARSET}"
        )

    @property
    def SQLALCHEMY_SERVER_URL(self) -> str:
        password = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{password}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}"
            f"?charset={self.MYSQL_CHARSET}"
        )

    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

## 七、步骤 3：创建安全工具模块

### 要做什么

创建密码哈希、密码校验、JWT 创建、JWT 解析工具。

### 为什么做

登录认证需要保证密码不明文存储，接口认证需要使用 Token。

### 相对路径

```text
backend/app/core/security.py
```

### 完整代码

```python
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_data: dict[str, Any] | None = None,
) -> str:
    expire = datetime.now(UTC) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
    }
    if extra_data:
        payload.update(extra_data)

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def safe_decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return decode_access_token(token)
    except JWTError:
        return None
```

### 注意事项

1. JWT 的 `sub` 存用户 ID。
2. `JWT_SECRET_KEY` 正式环境必须改成强随机字符串。
3. `safe_decode_access_token` 用于依赖函数中处理无效 Token。

## 八、步骤 4：创建认证 Schema

### 相对路径

```text
backend/app/schemas/auth.py
```

### 完整代码

```python
from pydantic import BaseModel, Field

from app.schemas.common import ORMBaseModel


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64, description="用户名")
    password: str = Field(min_length=1, max_length=128, description="密码")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleInfo(ORMBaseModel):
    id: int
    role_code: str
    role_name: str


class CurrentUserInfo(ORMBaseModel):
    user_id: int
    role_id: int
    username: str
    real_name: str | None = None
    phone: str | None = None
    status: int | None = None
    role: RoleInfo | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserInfo
    permissions: list[str]


class PermissionMenu(BaseModel):
    permission_code: str
    permission_name: str
    menu_path: str | None = None
```

## 九、步骤 5：创建系统权限 Schema

### 相对路径

```text
backend/app/schemas/system.py
```

### 完整代码

```python
from pydantic import BaseModel, Field

from app.schemas.common import ORMBaseModel


class RoleBase(BaseModel):
    role_code: str = Field(min_length=1, max_length=64, description="角色代码")
    role_name: str = Field(min_length=1, max_length=64, description="角色名称")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    role_code: str | None = Field(default=None, min_length=1, max_length=64)
    role_name: str | None = Field(default=None, min_length=1, max_length=64)


class RoleRead(ORMBaseModel):
    id: int
    role_code: str
    role_name: str


class PermissionBase(BaseModel):
    permission_code: str = Field(min_length=1, max_length=64, description="权限标识")
    permission_name: str = Field(min_length=1, max_length=64, description="权限名称")
    menu_path: str | None = Field(default=None, max_length=255, description="菜单路径")


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    permission_code: str | None = Field(default=None, min_length=1, max_length=64)
    permission_name: str | None = Field(default=None, min_length=1, max_length=64)
    menu_path: str | None = Field(default=None, max_length=255)


class PermissionRead(ORMBaseModel):
    id: int
    permission_code: str
    permission_name: str
    menu_path: str | None = None


class RolePermissionUpdate(BaseModel):
    permission_ids: list[int] = Field(default_factory=list)
```

## 十、步骤 6：创建初始化种子数据

### 要做什么

初始化角色、权限、角色权限绑定和默认管理员账号。

### 为什么做

使用 ORM 自动建表后，数据库是空的。如果不初始化数据，无法登录。

### 相对路径

```text
backend/app/db/seed.py
```

### 完整代码

```python
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.system import SysPermission, SysRole, SysRolePermission
from app.models.user import SysUser


logger = logging.getLogger(__name__)


DEFAULT_ROLES = [
    ("admin", "超级管理员"),
    ("store_admin", "门店管理员"),
    ("coach", "教练"),
    ("member", "普通会员"),
]


DEFAULT_PERMISSIONS = [
    ("user:list", "用户列表", "/users"),
    ("user:create", "新增用户", None),
    ("user:update", "修改用户", None),
    ("user:delete", "删除用户", None),
    ("role:list", "角色列表", "/system/roles"),
    ("role:create", "新增角色", None),
    ("role:update", "修改角色", None),
    ("role:delete", "删除角色", None),
    ("permission:list", "权限列表", "/system/permissions"),
    ("store:list", "门店列表", "/stores"),
    ("store:create", "新增门店", None),
    ("store:update", "修改门店", None),
    ("store:delete", "删除门店", None),
    ("course:list", "课程列表", "/courses"),
    ("course:create", "新增课程", None),
    ("course:update", "修改课程", None),
    ("course:delete", "删除课程", None),
    ("action:list", "动作列表", "/actions"),
    ("action:create", "新增动作", None),
    ("action:update", "修改动作", None),
    ("action:delete", "删除动作", None),
    ("event:list", "活动列表", "/content/events"),
    ("event:create", "新增活动", None),
    ("event:update", "修改活动", None),
    ("event:delete", "删除活动", None),
    ("slogan:list", "Slogan列表", "/content/slogans"),
    ("slogan:update", "修改Slogan", None),
]


def get_or_create_role(db: Session, role_code: str, role_name: str) -> SysRole:
    role = db.scalar(select(SysRole).where(SysRole.role_code == role_code))
    if role:
        return role

    role = SysRole(role_code=role_code, role_name=role_name)
    db.add(role)
    db.flush()
    return role


def get_or_create_permission(
    db: Session,
    permission_code: str,
    permission_name: str,
    menu_path: str | None,
) -> SysPermission:
    permission = db.scalar(
        select(SysPermission).where(SysPermission.permission_code == permission_code)
    )
    if permission:
        return permission

    permission = SysPermission(
        permission_code=permission_code,
        permission_name=permission_name,
        menu_path=menu_path,
    )
    db.add(permission)
    db.flush()
    return permission


def bind_role_permission(
    db: Session,
    role_id: int,
    permission_id: int,
) -> None:
    exists = db.scalar(
        select(SysRolePermission).where(
            SysRolePermission.role_id == role_id,
            SysRolePermission.permission_id == permission_id,
        )
    )
    if exists:
        return

    db.add(
        SysRolePermission(
            role_id=role_id,
            permission_id=permission_id,
        )
    )


def seed_roles_and_permissions(db: Session) -> None:
    roles = {
        role_code: get_or_create_role(db, role_code, role_name)
        for role_code, role_name in DEFAULT_ROLES
    }

    permissions = [
        get_or_create_permission(db, code, name, menu_path)
        for code, name, menu_path in DEFAULT_PERMISSIONS
    ]

    admin_role = roles["admin"]
    for permission in permissions:
        bind_role_permission(db, admin_role.id, permission.id)


def seed_admin_user(db: Session) -> None:
    admin_user = db.scalar(
        select(SysUser).where(SysUser.username == settings.DEFAULT_ADMIN_USERNAME)
    )
    if admin_user:
        return

    admin_role = db.scalar(select(SysRole).where(SysRole.role_code == "admin"))
    if not admin_role:
        raise RuntimeError("admin role is missing")

    admin_user = SysUser(
        role_id=admin_role.id,
        username=settings.DEFAULT_ADMIN_USERNAME,
        password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
        real_name=settings.DEFAULT_ADMIN_REAL_NAME,
        status=1,
    )
    db.add(admin_user)


def seed_initial_data(db: Session) -> None:
    seed_roles_and_permissions(db)
    seed_admin_user(db)
    db.commit()
    logger.info("Initial data checked")
```

### 注意事项

1. 种子数据函数可以重复执行，不会重复插入已有角色、权限、管理员。
2. 管理员账号默认来自 `.env`。
3. 管理员密码会通过 `get_password_hash` 加密后保存。

## 十一、步骤 7：修改数据库初始化流程

### 相对路径

```text
backend/app/db/init_db.py
```

### 完整代码

```python
import logging
import re

from sqlalchemy import create_engine, text

from app.core.config import settings
from app.db.base import Base
from app.db.seed import seed_initial_data
from app.db.session import SessionLocal, engine


logger = logging.getLogger(__name__)


def validate_database_name(database_name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_]+", database_name):
        raise ValueError("MYSQL_DATABASE can only contain letters, numbers, and underscores")
    return database_name


def create_database_if_not_exists() -> None:
    database_name = validate_database_name(settings.MYSQL_DATABASE)

    server_engine = create_engine(
        settings.SQLALCHEMY_SERVER_URL,
        isolation_level="AUTOCOMMIT",
        pool_pre_ping=True,
    )

    create_database_sql = text(
        f"CREATE DATABASE IF NOT EXISTS `{database_name}` "
        f"CHARACTER SET {settings.MYSQL_CHARSET} "
        "COLLATE utf8mb4_general_ci"
    )

    with server_engine.connect() as connection:
        connection.execute(create_database_sql)

    server_engine.dispose()
    logger.info("Database checked: %s", database_name)


def create_tables_if_not_exists() -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables checked")


def seed_data_if_needed() -> None:
    if not settings.AUTO_SEED_DATA:
        return

    db = SessionLocal()
    try:
        seed_initial_data(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    create_database_if_not_exists()
    create_tables_if_not_exists()
    seed_data_if_needed()
```

## 十二、步骤 8：创建认证 Service

### 相对路径

```text
backend/app/services/auth.py
```

### 完整代码

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.system import SysPermission, SysRolePermission
from app.models.user import SysUser


def get_user_by_username(db: Session, username: str) -> SysUser | None:
    return db.scalar(select(SysUser).where(SysUser.username == username))


def authenticate_user(
    db: Session,
    username: str,
    password: str,
) -> SysUser | None:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if user.status != 1:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def get_user_permission_codes(db: Session, role_id: int) -> list[str]:
    stmt = (
        select(SysPermission.permission_code)
        .join(
            SysRolePermission,
            SysRolePermission.permission_id == SysPermission.id,
        )
        .where(SysRolePermission.role_id == role_id)
        .order_by(SysPermission.id.asc())
    )
    return list(db.scalars(stmt).all())


def get_user_menus(db: Session, role_id: int) -> list[dict]:
    stmt = (
        select(SysPermission)
        .join(
            SysRolePermission,
            SysRolePermission.permission_id == SysPermission.id,
        )
        .where(
            SysRolePermission.role_id == role_id,
            SysPermission.menu_path.is_not(None),
        )
        .order_by(SysPermission.id.asc())
    )
    permissions = db.scalars(stmt).all()
    return [
        {
            "permission_code": item.permission_code,
            "permission_name": item.permission_name,
            "menu_path": item.menu_path,
        }
        for item in permissions
    ]
```

## 十三、步骤 9：创建系统权限 Service

### 相对路径

```text
backend/app/services/system.py
```

### 完整代码

```python
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException
from app.models.system import SysPermission, SysRole, SysRolePermission
from app.schemas.system import RoleCreate, RoleUpdate


def list_roles(db: Session) -> list[SysRole]:
    return list(db.scalars(select(SysRole).order_by(SysRole.id.asc())).all())


def create_role(db: Session, role_in: RoleCreate) -> SysRole:
    exists = db.scalar(select(SysRole).where(SysRole.role_code == role_in.role_code))
    if exists:
        raise BusinessException(message="role_code already exists", code=400)

    role = SysRole(**role_in.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(db: Session, role_id: int, role_in: RoleUpdate) -> SysRole:
    role = db.get(SysRole, role_id)
    if not role:
        raise BusinessException(message="role not found", code=404)

    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)

    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, role_id: int) -> None:
    role = db.get(SysRole, role_id)
    if not role:
        raise BusinessException(message="role not found", code=404)
    if role.role_code == "admin":
        raise BusinessException(message="admin role cannot be deleted", code=400)

    db.delete(role)
    db.commit()


def list_permissions(db: Session) -> list[SysPermission]:
    return list(db.scalars(select(SysPermission).order_by(SysPermission.id.asc())).all())


def update_role_permissions(
    db: Session,
    role_id: int,
    permission_ids: list[int],
) -> None:
    role = db.get(SysRole, role_id)
    if not role:
        raise BusinessException(message="role not found", code=404)

    db.execute(delete(SysRolePermission).where(SysRolePermission.role_id == role_id))

    for permission_id in permission_ids:
        permission = db.get(SysPermission, permission_id)
        if not permission:
            raise BusinessException(message=f"permission not found: {permission_id}", code=404)
        db.add(
            SysRolePermission(
                role_id=role_id,
                permission_id=permission_id,
            )
        )

    db.commit()
```

## 十四、步骤 10：创建认证依赖

### 相对路径

```text
backend/app/api/deps.py
```

### 完整代码

```python
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import safe_decode_access_token
from app.db.session import get_db
from app.models.system import SysPermission, SysRolePermission
from app.models.user import SysUser


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> SysUser:
    payload = safe_decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token subject",
        )

    user = db.get(SysUser, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user not found",
        )
    if user.status != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="user disabled",
        )

    return user


def has_permission(db: Session, role_id: int, permission_code: str) -> bool:
    stmt = (
        select(SysPermission.id)
        .join(
            SysRolePermission,
            SysRolePermission.permission_id == SysPermission.id,
        )
        .where(
            SysRolePermission.role_id == role_id,
            SysPermission.permission_code == permission_code,
        )
    )
    return db.scalar(stmt) is not None


def require_permission(permission_code: str) -> Callable:
    def checker(
        db: Session = Depends(get_db),
        current_user: SysUser = Depends(get_current_user),
    ) -> SysUser:
        if has_permission(db, current_user.role_id, permission_code):
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="permission denied",
        )

    return checker
```

### 注意事项

后续业务接口这样使用：

```python
current_user: SysUser = Depends(require_permission("course:list"))
```

## 十五、步骤 11：创建登录认证路由

### 相对路径

```text
backend/app/api/v1/auth.py
```

### 完整代码

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import SysUser
from app.schemas.auth import LoginRequest
from app.services.auth import (
    authenticate_user,
    get_user_menus,
    get_user_permission_codes,
)
from app.utils.response import success


router = APIRouter(prefix="/auth", tags=["登录认证"])


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="username or password error",
        )

    access_token = create_access_token(subject=str(user.user_id))
    permissions = get_user_permission_codes(db, user.role_id)

    return success(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "role_id": user.role_id,
                "username": user.username,
                "real_name": user.real_name,
                "phone": user.phone,
                "status": user.status,
            },
            "permissions": permissions,
        }
    )


@router.get("/me")
def get_me(current_user: SysUser = Depends(get_current_user)) -> dict:
    return success(
        data={
            "user_id": current_user.user_id,
            "role_id": current_user.role_id,
            "username": current_user.username,
            "real_name": current_user.real_name,
            "phone": current_user.phone,
            "status": current_user.status,
        }
    )


@router.get("/permissions")
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(get_current_user),
) -> dict:
    return success(data=get_user_permission_codes(db, current_user.role_id))


@router.get("/menus")
def get_my_menus(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(get_current_user),
) -> dict:
    return success(data=get_user_menus(db, current_user.role_id))
```

## 十六、步骤 12：创建角色权限管理路由

### 相对路径

```text
backend/app/api/v1/system.py
```

### 完整代码

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.db.session import get_db
from app.models.user import SysUser
from app.schemas.system import RoleCreate, RolePermissionUpdate, RoleUpdate
from app.services.system import (
    create_role,
    delete_role,
    list_permissions,
    list_roles,
    update_role,
    update_role_permissions,
)
from app.utils.response import success


router = APIRouter(prefix="/system", tags=["系统权限"])


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("role:list")),
) -> dict:
    roles = list_roles(db)
    return success(
        data=[
            {
                "id": item.id,
                "role_code": item.role_code,
                "role_name": item.role_name,
            }
            for item in roles
        ]
    )


@router.post("/roles")
def add_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("role:create")),
) -> dict:
    role = create_role(db, payload)
    return success(
        data={
            "id": role.id,
            "role_code": role.role_code,
            "role_name": role.role_name,
        }
    )


@router.put("/roles/{role_id}")
def edit_role(
    role_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("role:update")),
) -> dict:
    role = update_role(db, role_id, payload)
    return success(
        data={
            "id": role.id,
            "role_code": role.role_code,
            "role_name": role.role_name,
        }
    )


@router.delete("/roles/{role_id}")
def remove_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("role:delete")),
) -> dict:
    delete_role(db, role_id)
    return success(message="deleted")


@router.get("/permissions")
def get_permissions(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("permission:list")),
) -> dict:
    permissions = list_permissions(db)
    return success(
        data=[
            {
                "id": item.id,
                "permission_code": item.permission_code,
                "permission_name": item.permission_name,
                "menu_path": item.menu_path,
            }
            for item in permissions
        ]
    )


@router.put("/roles/{role_id}/permissions")
def assign_role_permissions(
    role_id: int,
    payload: RolePermissionUpdate,
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(require_permission("role:update")),
) -> dict:
    update_role_permissions(db, role_id, payload.permission_ids)
    return success(message="updated")
```

## 十七、步骤 13：注册路由

### 相对路径

```text
backend/app/api/router.py
```

### 完整代码

```python
from fastapi import APIRouter

from app.api.v1 import auth, health, system


api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(system.router)
```

## 十八、步骤 14：创建安全工具测试

### 相对路径

```text
backend/tests/test_security.py
```

### 完整代码

```python
from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_and_verify() -> None:
    password = "123456"
    hashed_password = get_password_hash(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrong-password", hashed_password)


def test_create_and_decode_access_token() -> None:
    token = create_access_token(subject="1")
    payload = decode_access_token(token)

    assert payload["sub"] == "1"
```

## 十九、步骤 15：启动服务验证

### 启动命令

确保当前目录是：

```text
FastAPI_Vue3_JoyFit/backend
```

执行：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后应该完成：

1. 创建数据库。
2. 创建数据表。
3. 初始化角色。
4. 初始化权限。
5. 初始化管理员账号。

## 二十、步骤 16：验证登录

### Swagger 地址

```text
http://127.0.0.1:8000/docs
```

### 登录接口

```text
POST /api/auth/login
```

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

成功返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "xxx",
    "token_type": "bearer",
    "user": {
      "user_id": 1,
      "role_id": 1,
      "username": "admin",
      "real_name": "系统管理员",
      "phone": null,
      "status": 1
    },
    "permissions": []
  }
}
```

注意：实际返回的 `permissions` 应该包含管理员权限列表。如果为空，需要检查种子数据是否成功绑定了角色权限。

### 当前用户接口

登录成功后，复制 `access_token`。

在 Swagger 右上角点击 `Authorize`，填入：

```text
Bearer 你的token
```

然后访问：

```text
GET /api/auth/me
```

## 二十一、步骤 17：运行测试

执行：

```bash
pytest
```

预期：

```text
全部测试通过
```

如果 `test_security.py` 出现 bcrypt 相关错误，看本文底部常见问题。

## 二十二、本阶段验收清单

| 序号 | 验收项 | 成功标准 |
| --- | --- | --- |
| 1 | 自动初始化数据 | 数据库中有角色、权限、管理员 |
| 2 | 密码加密 | 管理员密码不是明文 |
| 3 | 登录成功 | `/api/auth/login` 返回 Token |
| 4 | 当前用户成功 | `/api/auth/me` 返回用户信息 |
| 5 | 权限列表成功 | `/api/auth/permissions` 返回权限标识 |
| 6 | 菜单列表成功 | `/api/auth/menus` 返回菜单 |
| 7 | 角色列表成功 | `/api/system/roles` 可访问 |
| 8 | 权限列表成功 | `/api/system/permissions` 可访问 |
| 9 | 无 Token 被拒绝 | 返回 401 |
| 10 | 无权限被拒绝 | 返回 403 |

## 二十三、常见问题

### 1. 登录提示 username or password error

原因：

1. 管理员账号没有初始化。
2. `.env` 中管理员账号密码和你输入的不一致。
3. 管理员状态不是 1。

检查：

```sql
SELECT user_id, username, status FROM sys_user;
SELECT id, role_code FROM sys_role;
SELECT * FROM sys_role_permission;
```

### 2. 登录成功但 permissions 是空数组

原因：

1. 权限数据没有初始化。
2. `sys_role_permission` 没有绑定管理员角色和权限。
3. `seed_initial_data` 没有执行。

检查：

```sql
SELECT * FROM sys_permission;
SELECT * FROM sys_role_permission;
```

### 3. Token 访问接口返回 Not authenticated

原因：

Swagger 中没有点击 `Authorize`，或者没有按 bearer token 格式传递。

格式：

```text
Bearer eyJ...
```

### 4. bcrypt 相关报错

如果出现 passlib 和 bcrypt 版本兼容问题，可以先降级 bcrypt：

```bash
pip install "bcrypt==4.0.1"
pip freeze > requirements.txt
```

然后重新运行：

```bash
pytest
```

## 二十四、进入下一阶段的条件

满足以下条件后，可以进入第四阶段：

```text
04_后端用户门店模块.md
```

必须满足：

1. 自动建表成功。
2. 自动初始化数据成功。
3. 管理员可以登录。
4. Token 可以访问 `/api/auth/me`。
5. 权限接口可以控制访问。
6. `pytest` 通过。

## 二十五、问题记录与修复方案

后续你在第三阶段实践中遇到问题，可以直接把错误信息发给我。

我会做两件事：

1. 判断错误属于密码加密、JWT、种子数据、权限绑定、依赖函数还是路由注册问题。
2. 将修复办法追加到本文件底部。

### 问题追加格式

```text
### 问题 N：问题标题

#### 报错现象

这里记录你遇到的报错信息。

#### 原因分析

这里说明为什么会报错。

#### 修复办法

这里给出具体修复步骤。

#### 需要修改的文件

- 相对路径：xxx
- 修改说明：xxx
- 完整代码或补丁：xxx
```

### 问题 1：passlib 与 bcrypt 5.0.0 不兼容，导致应用启动失败

#### 报错现象

启动后端时，自动初始化管理员账号失败：

```text
passlib.handlers.bcrypt: (trapped) error reading bcrypt version
AttributeError: module 'bcrypt' has no attribute '__about__'
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
ERROR: Application startup failed. Exiting.
```

错误位置通常在：

```text
backend/app/db/seed.py
password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
```

以及：

```text
backend/app/core/security.py
return pwd_context.hash(password)
```

#### 原因分析

当前环境中安装的是：

```text
passlib==1.7.4
bcrypt==5.0.0
```

`passlib==1.7.4` 对新版 `bcrypt` 的兼容性不好。

`bcrypt 5.0.0` 移除了 passlib 旧逻辑依赖的 `__about__.__version__`，并且对超过 72 bytes 的密码处理更严格，导致 passlib 在检测 bcrypt 后端时直接失败。

#### 修复办法

开发阶段最简单稳定的方式：把 `bcrypt` 降级到 `4.0.1`。

确保当前目录是：

```text
FastAPI_Vue3_JoyFit/backend
```

并且虚拟环境已经激活：

```bash
source .venv/bin/activate
```

然后执行：

```bash
pip uninstall -y bcrypt
pip install "bcrypt==4.0.1"
pip freeze > requirements.txt
```

#### 需要修改的文件

相对路径：

```text
backend/requirements.txt
```

修改说明：

确认里面的 bcrypt 版本是：

```text
bcrypt==4.0.1
```

不能继续是：

```text
bcrypt==5.0.0
```

#### 修复后验证

重新启动后端：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

如果看到：

```text
Database checked: FastAPI_Vue3_JoyFit
Database tables checked
Initial data checked
Application startup complete.
```

说明修复成功。

然后测试登录：

```text
POST /api/auth/login
```

请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

### 问题 2：在项目根目录激活虚拟环境失败

#### 报错现象

在项目根目录执行：

```bash
source .venv/bin/activate
```

出现：

```text
source: no such file or directory: .venv/bin/activate
```

#### 原因分析

当前虚拟环境创建在：

```text
backend/.venv
```

而不是项目根目录：

```text
.venv
```

所以必须先进入 `backend` 目录再激活。

#### 修复办法

```bash
cd backend
source .venv/bin/activate
```

或者在项目根目录直接执行：

```bash
source backend/.venv/bin/activate
```

### 问题 3：使用 Ctrl+Z 暂停 uvicorn 后，再启动提示端口占用

#### 报错现象

按下 `Ctrl+Z` 后，再次启动：

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

出现：

```text
ERROR: [Errno 48] Address already in use
```

#### 原因分析

`Ctrl+Z` 不是停止进程，而是把进程挂起到后台。

原来的 `uvicorn` 仍然占用 `8000` 端口，所以新的服务无法启动。

#### 修复办法

推荐停止 uvicorn 时使用：

```text
Ctrl+C
```

如果已经误按了 `Ctrl+Z`，可以查看后台任务：

```bash
jobs
```

恢复任务到前台：

```bash
fg
```

然后按：

```text
Ctrl+C
```

如果已经知道进程 ID，也可以杀掉旧进程：

```bash
kill -9 进程ID
```

例如：

```bash
kill -9 69251 69253
```

#### 后续建议

开发时停止服务统一用 `Ctrl+C`，不要用 `Ctrl+Z`。

### 问题 4：Swagger Authorize 弹窗不是粘贴 Token，而是用户名密码换 Token

#### 现象

点击 Swagger 右上角 `Authorize` 后，弹窗显示：

```text
OAuth2PasswordBearer (OAuth2, password)
Token URL: /api/auth/login
username:
password:
client_id:
client_secret:
```

这个界面没有直接粘贴 `Bearer Token` 的输入框。

#### 原因分析

代码中使用的是：

```python
OAuth2PasswordBearer(tokenUrl="/api/auth/login")
```

所以 Swagger 会把它识别为 OAuth2 Password Flow。

这种模式下，Swagger 不是让你粘贴 token，而是让你输入用户名和密码，然后由 Swagger 自动请求 `tokenUrl` 换取 token。

但是如果 `/api/auth/login` 接口使用的是 JSON 请求体：

```json
{
  "username": "admin",
  "password": "123456"
}
```

并且返回的是统一响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "xxx",
    "token_type": "bearer"
  }
}
```

那么 Swagger 的 `Authorize` 弹窗不一定能正常工作。

原因是 OAuth2 Password Flow 期望登录接口接收的是表单数据：

```text
application/x-www-form-urlencoded
```

并且期望返回顶层字段：

```json
{
  "access_token": "xxx",
  "token_type": "bearer"
}
```

#### 临时填写方式

如果你已经按 OAuth2 Password Flow 改好了接口，那么弹窗这样填：

```text
username: admin
password: 123456
client_id: 留空
client_secret: 留空
```

然后点击：

```text
Authorize
```

#### 推荐修复方案

保留原来的 JSON 登录接口：

```text
POST /api/auth/login
```

这个接口继续给前端使用，返回统一响应格式。

另外新增一个专门给 Swagger 使用的表单登录接口：

```text
POST /api/auth/token
```

然后把：

```python
OAuth2PasswordBearer(tokenUrl="/api/auth/login")
```

改成：

```python
OAuth2PasswordBearer(tokenUrl="/api/auth/token")
```

这样做的好处：

1. 前端仍然使用 JSON 登录接口。
2. Swagger Authorize 弹窗可以正常使用用户名密码换 Token。
3. 不破坏统一响应格式。

#### 需要修改的文件 1

相对路径：

```text
backend/app/api/deps.py
```

修改说明：

把：

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
```

改成：

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
```

#### 需要修改的文件 2

相对路径：

```text
backend/app/api/v1/auth.py
```

修改说明：

新增 `/token` 接口，专门给 Swagger Authorize 使用。

完整代码：

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import SysUser
from app.schemas.auth import LoginRequest
from app.services.auth import (
    authenticate_user,
    get_user_menus,
    get_user_permission_codes,
)
from app.utils.response import success


router = APIRouter(prefix="/auth", tags=["登录认证"])


@router.post("/token")
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="username or password error",
        )

    return {
        "access_token": create_access_token(subject=str(user.user_id)),
        "token_type": "bearer",
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="username or password error",
        )

    access_token = create_access_token(subject=str(user.user_id))
    permissions = get_user_permission_codes(db, user.role_id)

    return success(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "role_id": user.role_id,
                "username": user.username,
                "real_name": user.real_name,
                "phone": user.phone,
                "status": user.status,
            },
            "permissions": permissions,
        }
    )


@router.get("/me")
def get_me(current_user: SysUser = Depends(get_current_user)) -> dict:
    return success(
        data={
            "user_id": current_user.user_id,
            "role_id": current_user.role_id,
            "username": current_user.username,
            "real_name": current_user.real_name,
            "phone": current_user.phone,
            "status": current_user.status,
        }
    )


@router.get("/permissions")
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(get_current_user),
) -> dict:
    return success(data=get_user_permission_codes(db, current_user.role_id))


@router.get("/menus")
def get_my_menus(
    db: Session = Depends(get_db),
    current_user: SysUser = Depends(get_current_user),
) -> dict:
    return success(data=get_user_menus(db, current_user.role_id))
```

#### 修复后使用方式

重启后端后，打开：

```text
http://127.0.0.1:8000/docs
```

点击右上角：

```text
Authorize
```

填写：

```text
username: admin
password: 123456
client_id: 留空
client_secret: 留空
```

点击 `Authorize`。

成功后，再访问：

```text
GET /api/auth/me
```

如果能返回当前用户信息，说明 Swagger 授权成功。
