# Obsidian Export-Bases-Files Plugin (导出 Bases 文件插件)

[English](./README.md) | 简体中文

**Export-Bases-Files** 是一款 Obsidian 插件，旨在连接 Obsidian 强大的内部 **Bases** 功能与您的外部文件系统。它允许通过简单的几次点击，根据您在 Bases Table View（表格视图）中设置的过滤条件，将特定的文件集导出到电脑上的任何文件夹中。

![Demo](./assets/obsidian-file-exporter-demo.gif)

## 🚀 安装方法

由于此插件尚未发布到 Obsidian 官方社区插件库，您可以使用 **BRAT** 插件或手动进行安装。

### 通过 BRAT 安装 (推荐)
1. 在社区插件市场中安装 [Obsidian 42 - BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件。
2. 打开 **设置** > **BRAT** > **Add Beta plugin**。
3. 粘贴本仓库库的 URL：`https://github.com/ljklonepiece/obsidian-export-files-by-bases`
4. 点击 **Add Plugin**。
5. 在 **设置** > **社区插件** 中启用 **Export-Bases-Files**。

### 手动安装
1. 从 [Releases](https://github.com/ljklonepiece/obsidian-export-files-by-bases/releases) 页面下载最新的 `main.js`、`manifest.json` 和 `styles.css`。
2. 在您的库目录 `.obsidian/plugins/` 下创建一个名为 `obsidian-export-by-bases-plugin` 的文件夹。
3. 将下载的文件移动到该文件夹中。
4. 重新加载 Obsidian 并在 **设置** > **社区插件** 中启用该插件。

## 📖 使用指南

1. **打开界面**：点击侧边栏的 **导出 (Upload/Export)** 图标，或使用命令面板 (`Cmd/Ctrl + P`) 搜索 `Export-Bases-Files: Open Export Interface`。
2. **选择 Base**：选择包含您要导出的数据的 `.base` 文件。
3. **选择视图**：选择应用了所需过滤条件的特定表格视图 (Table View)。
4. **选择目的地**：点击 **浏览... (Browse...)** 按钮选择文件导出到电脑的具体位置。
5. **可选设置**：您可以选择包含或排除特定文件类型：
    - **包含内部文件 (Include Internal Files)**：如果勾选，将包含链接到的 Obsidian 特定文件，如 `.base` 和 `.canvas`。
    - **包含媒体文件 (Include Media Files)**：如果勾选，将包含导出范围内发现的图片、音频、视频和压缩包文件。
6. **导出**：点击 **导出 (Export)** 按钮。完成后会显示通知提示！


## 开发者相关

如果您想从源码构建：
1. 克隆仓库。
2. 运行 `npm install`。
3. 运行 `npm run build` 生成 `main.js`。
4. 运行 `npm test` 通过单元测试验证逻辑。

## 支持作者

如果您觉得这个插件对您有所帮助，欢迎支持我的工作：

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/ljklonepiece)

中国用户：
<img src="./assets/donation-qr-cn.jpg" width="300" alt="支持作者：微信/支付宝" />

如果您遇到任何问题或有功能建议，请在 [GitHub repository](https://github.com/ljklonepiece/obsidian-export-files-by-bases/issues) 提交 Issue。
