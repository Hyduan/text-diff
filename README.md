# 比一比 · TextDiff

两段文本，一眼看清不同。

面向 Windows 和 macOS 的轻量桌面文本对比工具，离线优先，文本在本机处理。

## 当前进度

已初始化桌面基础工程：Tauri 原生窗口、React 欢迎页、应用图标、类型检查和构建命令。当前尚未实现文本输入与差异计算。

后续计划：左右编辑、中文逐字与按行对比、文本文件打开与拖入、同步滚动、差异跳转，以及忽略空白和大小写。

## 技术栈

- Tauri 2 + Rust：桌面窗口和本地能力。
- React + TypeScript + Vite：界面与前端构建。
- CSS Modules：组件样式隔离；全局基础样式与主题变量集中在 `src/styles/global.css`。
- pnpm：前端依赖与脚本管理。
- 计划引入 CodeMirror 6 和 jsdiff；基础工程阶段尚未安装。

## 开发环境

- Node.js 22.12 或更高版本。
- pnpm，版本由 `package.json` 的 `packageManager` 指定。
- Rust stable；`rust-toolchain.toml` 声明工具链及 rustfmt、clippy 组件。
- macOS：安装 Xcode Command Line Tools，使用 `xcode-select --install`。
- Windows：安装 Visual Studio C++ Build Tools（桌面 C++ 开发工作负载）和 WebView2。

完整系统依赖见 [Tauri 官方环境准备说明](https://v2.tauri.app/start/prerequisites/)。

安装 Rust 后，确认当前终端能运行 `cargo --version`。如果 macOS 上未自动加入 PATH，可执行：

```sh
source "$HOME/.cargo/env"
```

## 运行

```sh
pnpm install --frozen-lockfile
pnpm desktop:dev
```

`desktop:dev` 会自动启动 Vite 和 Tauri 原生窗口。开发服务仅监听 `127.0.0.1:1420`；端口被占用时会明确报错，不自动换端口。不要同时运行 `pnpm dev` 和 `pnpm desktop:dev`。

仅预览前端时使用 `pnpm dev`；浏览器预览不能替代原生桌面验证。

## 检查与构建

| 命令 | 作用 |
| --- | --- |
| `pnpm check` | 检查应用代码和 Vite 配置的 TypeScript 类型 |
| `pnpm check:rust` | 检查 Rust 格式并运行 clippy，警告视为错误 |
| `pnpm build` | 类型检查并生成前端产物到 `dist/` |
| `pnpm desktop:build` | 构建当前平台的生产桌面应用与安装包 |
| `pnpm desktop:build --debug --bundles app` | 在 macOS 上构建便于本地验证的调试 `.app` |

首次 Rust 构建会下载依赖；后续使用 `pnpm-lock.yaml` 和 `src-tauri/Cargo.lock` 固定依赖版本。

桌面产物位于 `src-tauri/target/release/bundle/`；调试构建则位于 `src-tauri/target/debug/bundle/`。Windows 与 macOS 需要在对应系统上分别验证和打包。当前尚未配置发布签名、公证或自动更新。

## 目录结构

```text
text-diff/
├── public/                  # 应用 SVG 图标
├── src/
│   ├── components/          # 按职责拆分的组件与各自的 CSS Module
│   ├── styles/              # 全局基础样式与主题变量
│   └── App.tsx              # 页面布局与组件组合
├── src-tauri/
│   ├── capabilities/        # 窗口权限配置
│   ├── icons/               # macOS 与 Windows 原生图标
│   ├── src/                 # Rust 桌面入口
│   ├── Cargo.toml
│   └── tauri.conf.json      # 应用窗口、开发服务与打包配置
├── package.json
├── pnpm-lock.yaml
├── rust-toolchain.toml
└── vite.config.ts
```
