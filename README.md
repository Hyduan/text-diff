# 比一比 · TextDiff

两段文本，一眼看清不同。

面向 Windows 和 macOS 的轻量桌面文本对比工具，离线优先，文本在本机处理。

## 当前进度

已实现文本对比的最小可用版本：

- 左右文本输入与粘贴、行号、自动换行、编辑撤销和查找。
- 按行定位差异，并精确高亮修改的中文字符及其他文本。
- 共享纵向滚动区域，自动对齐两侧相同内容。
- 差异分组统计、字符与行数、上一处 / 下一处循环跳转。
- 交换两侧文本、清空和中文示例；编辑区内支持 `F7` / `Shift+F7` 跳转差异。

后续计划：文件打开与拖入、编码识别、忽略空白和大小写、历史记录，以及大文件优化。

## 对比行为

- 输入中的 CRLF 和 CR 换行统一为 LF，不将不同换行编码本身视为文本差异；保留空行和末尾换行差异。
- 差异数量按相邻变化分组统计，新增、删除、修改是组数，不是行数或字符数。字符统计按 Unicode 码点计数。
- 差异特别复杂时会限制计算时间并按整段标记，界面会提示；当前尚未使用 Worker 做大文件后台计算。
- 所有文本仅在本机当前会话内处理，不自动保存，未接入后端或云端服务。

## 技术栈

- Tauri 2 + Rust：桌面窗口和本地能力。
- React + TypeScript + Vite：界面与前端构建。
- CSS Modules：组件样式隔离；全局基础样式与主题变量集中在 `src/styles/global.css`。
- pnpm：前端依赖与脚本管理。
- CodeMirror 6 + `@codemirror/merge`：双栏编辑、行号、自动对齐和差异分组。
- jsdiff（`diff`）：按行定位和逐字差异计算；字符高亮使用精确范围，不扩展到整词。
- Vitest + Playwright：算法边界与真实浏览器交互验证。

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

| 命令                                       | 作用                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| `pnpm check`                               | 检查应用代码、工具配置与浏览器测试的 TypeScript 类型 |
| `pnpm test`                                | 运行文本对比算法单元测试                             |
| `pnpm test:e2e`                            | 运行真实编辑器浏览器交互测试                         |
| `pnpm check:rust`                          | 检查 Rust 格式并运行 clippy，警告视为错误            |
| `pnpm build`                               | 类型检查并生成前端产物到 `dist/`                     |
| `pnpm desktop:build`                       | 构建当前平台的生产桌面应用与安装包                   |
| `pnpm desktop:build --debug --bundles app` | 在 macOS 上构建便于本地验证的调试 `.app`             |

首次运行浏览器测试前安装 Chromium：

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

macOS / Linux 已安装 Chrome 时，也可以运行 `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`，无需另行下载 Chromium。浏览器测试会自行启动并关闭 Vite，运行前应停止已有的 1420 端口开发服务。

首次 Rust 构建会下载依赖；后续使用 `pnpm-lock.yaml` 和 `src-tauri/Cargo.lock` 固定依赖版本。

桌面产物位于 `src-tauri/target/release/bundle/`；调试构建则位于 `src-tauri/target/debug/bundle/`。Windows 与 macOS 需要在对应系统上分别验证和打包。当前尚未配置发布签名、公证或自动更新。

## 目录结构

```text
text-diff/
├── public/                  # 应用 SVG 图标
├── src/
│   ├── components/          # 品牌、应用顶部栏与底部栏
│   ├── features/text-compare/ # 文本对比界面、编辑器适配、算法与单元测试
│   ├── styles/              # 全局基础样式与主题变量
│   └── App.tsx              # 页面布局与组件组合
├── src-tauri/
│   ├── capabilities/        # 窗口权限配置
│   ├── icons/               # macOS 与 Windows 原生图标
│   ├── src/                 # Rust 桌面入口
│   ├── Cargo.toml
│   └── tauri.conf.json      # 应用窗口、开发服务与打包配置
├── e2e/                     # 浏览器交互测试
├── package.json
├── pnpm-lock.yaml
├── rust-toolchain.toml
└── vite.config.ts
```
