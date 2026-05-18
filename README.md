# 自助下单平台 — 后端 API

Node.js + Express + MySQL + Redis 自助下单平台后端，包含完整 RBAC 权限、多仓库库存管理、订单状态机、优惠券系统及 Swagger 文档。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 MySQL/Redis 连接信息

# 3. 启动（开发模式，自动同步数据库表结构）
npm run dev

# 4. 查看接口文档
open http://localhost:3000/api-docs
```

## 目录结构

```
src/
├── config/          # 数据库、Redis、JWT、Swagger 配置
├── middlewares/     # 鉴权、RBAC、验证、错误处理
├── models/          # Sequelize ORM 模型 + 关联
├── modules/
│   ├── auth/        # 注册/登录/登出/刷新Token/改密
│   ├── users/       # 用户 CRUD（管理员）
│   ├── products/    # 商品上下架、分类管理
│   ├── warehouses/  # 仓库 CRUD、库存调整、流水日志
│   ├── orders/      # 下单、支付、取消（客户）
│   ├── admin/       # 后台订单管理、统计
│   └── coupons/     # 优惠券创建/领取/使用
└── utils/           # 响应封装、分页、加密、JWT、订单号
```

## API 模块

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/api/auth` | 注册、登录、双Token刷新、安全登出 |
| 用户 | `/api/users` | 用户CRUD、角色、状态管理（仅admin） |
| 商品 | `/api/products` | 商品上架/下架、分类树 |
| 仓库 | `/api/warehouses` | 多仓库管理、库存调整、流水日志 |
| 订单 | `/api/orders` | 下单锁库存、支付（Mock）、取消 |
| 后台订单 | `/api/admin/orders` | 全部订单、状态流转、销售统计 |
| 优惠券 | `/api/coupons` | 创建/领取/使用优惠券 |

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4
- **ORM**: Sequelize 6 + MySQL2
- **缓存/黑名单**: Redis (`node-redis` v4)
- **鉴权**: JWT（Access 15min + Refresh 7d）
- **权限**: RBAC（admin / operator / customer）
- **文档**: Swagger UI (swagger-jsdoc + swagger-ui-express)
- **安全**: bcryptjs 密码哈希、express-rate-limit 限流、Token 黑名单
