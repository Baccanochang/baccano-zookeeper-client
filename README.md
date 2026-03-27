# Baccano ZooKeeper Client

**Baccano ZooKeeper Client** 是一款基于 Tauri 构建的轻量级跨平台 ZooKeeper 客户端，面向开发人员和运维工程师，提供高效的节点数据查看与编辑能力。

## 特性

### 核心功能

| 功能 | 描述 |
|------|------|
| **连接管理** | 创建、编辑、删除、连接、断开 ZooKeeper 连接，支持多连接管理 |
| **节点浏览** | 树形结构浏览，懒加载子节点，支持展开/折叠 |
| **数据查看** | 查看节点数据和元数据（版本、时间戳、数据长度等） |
| **数据编辑** | 创建、更新、删除节点，支持删除确认 |
| **状态显示** | 连接状态实时显示，Toast 通知提示 |
| **系统托盘** | 最小化到托盘，托盘菜单，窗口恢复 |

### 技术亮点

- **轻量高效**：基于 Tauri 2.0 构建，启动快、内存占用低
- **连接可控**：每个连接独立管理，单连接异常不影响整体
- **安全可靠**：AES-256-GCM 加密存储凭据，日志脱敏
- **跨平台**：支持 Windows、macOS、Linux

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| [Tauri](https://tauri.app/) | 2.10.3 | 跨平台桌面框架 |
| [Rust](https://www.rust-lang.org/) | 1.93+ | 后端语言 |
| [React](https://react.dev/) | 18.x | 前端框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | 样式框架 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.x | 状态管理 |
| [zookeeper-client](https://crates.io/crates/zookeeper-client) | 0.11.1 | ZooKeeper 客户端 |
| [rusqlite](https://crates.io/crates/rusqlite) | 0.32 | SQLite 绑定 |
| [aes-gcm](https://crates.io/crates/aes-gcm) | 0.10 | 加密库 |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.70+
- [pnpm](https://pnpm.io/) 或 [npm](https://www.npmjs.com/)

### 安装依赖

```bash
# 安装前端依赖
npm install

# Rust 依赖会在首次运行时自动安装
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

## 项目结构

```
baccano-zookeeper-client/
├── src/                          # React 前端
│   ├── components/               # UI 组件
│   │   ├── Connection/           # 连接管理组件
│   │   ├── Node/                 # 节点操作组件
│   │   ├── Layout/               # 布局组件
│   │   └── ui/                   # 基础 UI 组件
│   ├── hooks/                    # React Hooks
│   ├── stores/                   # Zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   └── utils/                    # 工具函数
│
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── commands/             # Tauri 命令
│   │   ├── zk/                   # ZooKeeper 客户端封装
│   │   ├── storage/              # 本地存储
│   │   └── crypto/               # 加密模块
│   ├── Cargo.toml
│   └── tauri.conf.json
│
└── docs/                         # 文档
    ├── ARCHITECTURE.md
    ├── CODE_REVIEW.md
    └── DEVELOPMENT.md
```

## 使用指南

### 创建连接

1. 点击左侧连接列表的「新建连接」按钮
2. 填写连接名称、ZooKeeper 服务器地址（如 `127.0.0.1:2181`）
3. 可选配置会话超时和连接超时时间
4. 点击「保存」创建连接配置

### 连接到 ZooKeeper

1. 在连接列表中选择要连接的配置
2. 点击「连接」按钮建立连接
3. 连接成功后自动加载根节点

### 浏览节点

- 点击节点展开/折叠查看子节点
- 点击节点名称查看节点详情
- 子节点按需懒加载

### 操作节点

- **创建节点**：选择父节点后点击「创建子节点」
- **编辑数据**：选择节点后在右侧编辑数据内容
- **删除节点**：选择节点后点击「删除」，需确认操作

### 系统托盘

- 点击窗口关闭按钮可选择：
  - 最小化到托盘（保持连接）
  - 退出应用（断开所有连接）
- 右键托盘图标可：
  - 显示/隐藏窗口
  - 退出应用

## 安全性

- **凭据加密**：使用 AES-256-GCM 加密敏感信息
- **密钥存储**：使用系统密钥库安全存储密钥
  - Windows: DPAPI
  - macOS: Keychain
  - Linux: Secret Service API
- **日志脱敏**：日志中自动脱敏敏感信息

## 已知问题

| 问题 | 状态 | 计划 |
|------|------|------|
| CSP 策略未配置 | 待修复 | Sprint 1 |
| 后端缺少输入验证 | 待修复 | Sprint 1 |
| 节点树无虚拟化 | 待优化 | Growth 阶段 |
| 缺少单元测试 | 待添加 | Sprint 2 |

## 版本历史

### v0.1.0 (MVP)

**发布日期：** 2026-03-27

**新增功能：**
- 连接管理（创建/编辑/删除/连接/断开）
- 节点浏览（懒加载树形结构）
- 数据查看和编辑
- 连接配置持久化
- 系统托盘支持
- 凭据加密存储

## 开发文档

- [架构设计](docs/ARCHITECTURE.md)
- [代码评审](docs/CODE_REVIEW.md)
- [PRD 文档](_bmad-output/prd.md)

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/)
- [Tauri 扩展](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。