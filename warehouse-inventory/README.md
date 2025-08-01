# 库房商品出入记账系统

这是一个轻量级的库房商品出入库管理系统，旨在提供一个简洁、高效的方式来记录和跟踪库存、交易和客户信息。项目采用前后端分离架构，前端使用 React + Vite 构建，后端使用 Node.js + Express。

## ✨ 主要功能

- **客户管理**: 添加、编辑、删除客户信息。
- **产品管理**: 管理与特定客户关联的产品及其价格。
- **司机管理**: 记录司机信息，方便在出库时关联。
- **出库记录**: 创建详细的出库单，包括产品、数量、价格、司机等信息。
- **历史查询**: 按日期、客户、产品等多种条件筛选和查看历史交易记录。
- **用户认证**: 简单的用户登录系统，保护数据安全。
- **响应式设计**: 界面适配桌面和移动设备。

## 🛠️ 技术栈

- **前端**:
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
- **后端**:
  - [Node.js](https://nodejs.org/)
  - [Express](https://expressjs.com/)
  - [CORS](https://expressjs.com/en/resources/middleware/cors.html)

## 🚀 如何启动项目

本项目包含一个前端应用和一个后端服务，需要分别启动。

### 1. 启动后端服务

后端服务负责提供 API 和处理数据。

```bash
# 进入后端项目目录
# 注意：路径是 backend/backend
cd backend/backend

# 安装依赖
npm install

# 启动服务
npm start
```

服务启动后，会在 `http://localhost:3001` 上运行。

### 2. 启动前端应用

前端应用是用户与之交互的界面。

```bash
# (在项目根目录) 进入前端项目目录
cd warehouse-inventory

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

服务启动后，Vite 会在终端显示一个本地网址（通常是 `http://localhost:5173`）。在浏览器中打开此地址即可访问应用。

## 📂 项目结构

```
.
├── backend/              # 后端服务代码
│   └── backend/
│       ├── node_modules/
│       ├── package.json
│       └── server.js     # Express 服务器
└── warehouse-inventory/  # 前端应用代码 (Vite + React)
    ├── public/
    ├── src/
    │   ├── components/   # UI 组件
    │   ├── hooks/        # 自定义 Hooks (useAuth, useData)
    │   ├── lib/          # 工具函数
    │   ├── pages/        # 页面组件
    │   ├── types/        # TypeScript 类型定义
    │   ├── App.tsx       # 主应用组件和路由
    │   └── main.tsx      # 应用入口
    ├── package.json
    └── vite.config.ts
```

## 📝 未来计划

- [ ] **数据库集成**: 将后端数据从内存存储迁移到持久化数据库（如 PostgreSQL 或 MongoDB）。
- [ ] **更完善的认证**: 引入 JWT (JSON Web Tokens) 以增强 API 安全性。
- [ ] **数据统计与图表**: 在仪表盘页面添加数据可视化图表。
- [ ] **单元测试与集成测试**: 为关键功能添加自动化测试。
- [ ] **数据导出**: 实现将交易记录导出为 Excel 或 CSV 文件的功能。