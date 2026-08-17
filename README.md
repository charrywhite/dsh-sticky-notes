<h1 align="center">📝 DeepSeek 便签</h1>

<p align="center">
  <strong>中文</strong> · <a href="README.en.md">English</a>
</p>

<p align="center">
  <strong>让 DeepSeek Harness 拥有真正的便签纸</strong><br />
  <sub>可拖动 · 待办勾选 · 9 款皮肤 · 图片便签 · AI 读写</sub>
</p>

<p align="center">
  <a href="https://github.com/charrywhite/dsh-sticky-notes/stargazers"><img src="https://img.shields.io/github/stars/charrywhite/dsh-sticky-notes?style=flat&color=d97706" alt="Stars" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/charrywhite/dsh-sticky-notes?style=flat&color=059669" alt="License" /></a>
  <a href="https://github.com/charrywhite/dsh-sticky-notes/releases"><img src="https://img.shields.io/github/package-json/v/charrywhite/dsh-sticky-notes?style=flat&color=2563eb" alt="Version" /></a>
  <a href="https://github.com/charrywhite/dsh-sticky-notes"><img src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-7c3aed?style=flat" alt="DeepSeek Harness Plugin" /></a>
</p>

<p align="center">
  <img src="headline.png" alt="DeepSeek 便签 — 在 DeepSeek Harness 里贴便签" width="100%">
</p>

<p align="center">
  <img src="interface4.PNG" alt="DeepSeek 便签 — 界面截图" width="100%">
</p>

<br />

## 亮点

<table>
<tr>
<td width="50%">

### 📝 打字记录

每张便签就是一个待办列表,回车或点「添加」即可记下一条。

</td>
<td width="50%">

### 🤖 AI 协同

DeepSeek 模型可以直接**读**你的便签、帮你**写**便签(见 [第 3 节](#3-ai-模型读写便签))。

</td>
</tr>
<tr>
<td width="50%">

### ☑️ 勾选完成

点复选框,文字出现删除线并变淡;再点一下取消。

</td>
<td width="50%">

### 📌 多张便签

右上角「＋ 新建便签」随意添加,每张完全独立。

</td>
</tr>
<tr>
<td width="50%">

### 🖐 随意拖动

便签、收起的小标签、「新建便签」按钮都能拖到任意位置并记住。

</td>
<td width="50%">

### 🎨 9 套皮肤

经典黄、薄荷绿、樱花粉、天空蓝、暮光紫、暖橙日落、石墨暗夜、霓虹荧光、极简白纸,每张便签独立设置。

</td>
</tr>
<tr>
<td width="50%">

### 🖼 图片便签

上传或拖入图片,便签纸里直接展示,点击可更换。

</td>
<td width="50%">

### ✏️ 自定义标题

铅笔图标重命名,清空后标题可留白。

</td>
</tr>
<tr>
<td colspan="2">

### 🛡 数据可靠

每次改动即时保存,刷新、重开页面都不丢。

</td>
</tr>
</table>

## 皮肤一览

<p align="center">
  <img src="skins.png" alt="9 款皮肤预览" width="100%">
</p>
<p align="center"><sub>经典黄 · 薄荷绿 · 樱花粉 · 天空蓝 · 暮光紫 · 暖橙日落 · 石墨暗夜 · 霓虹荧光 · 极简白纸</sub></p>

---

## 1. 安装

> 前提:本机可执行 `dsh`(DeepSeek Harness CLI)。若 `pnpm` 不在 PATH,先执行 `npm i -g pnpm`(或 `corepack enable pnpm`)。

### 方式 A:一行命令安装(推荐)

```powershell
# 从 GitHub 仓库安装
dsh plugin --profile web add github:charrywhite/dsh-sticky-notes

# 或本地目录开发安装(link 指向插件目录,自动解析)
dsh plugin --profile web add link:C:/path/to/dsh-plugin-sticky-notes
```

安装完成后:

1. **重启 dsh web**(在启动它的终端 Ctrl+C,重新运行 `dsh web`)
2. **硬刷新浏览器页面**(Ctrl+F5),右侧就会出现便签

卸载:`dsh plugin --profile web remove dsh-sticky-notes`

### 方式 B:手动安装(备选)

把插件目录放到任意位置(下文以 `C:\path\to\dsh-plugin-sticky-notes` 为例),修改 web profile 配置:

**① 注册依赖与 bundle**

编辑 `%USERPROFILE%\.dsh\profiles\web\package.json`:

```json
{
  "dependencies": {
    "dsh-sticky-notes": "link:C:/path/to/dsh-plugin-sticky-notes"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-sticky-notes"
      ]
    }
  }
}
```

> `link:` 指向插件目录的绝对路径,斜杠 `/` 或反斜杠 `\` 均可(JSON 里建议用 `/`)。

**② 在 profile 目录执行 pnpm install**

```powershell
cd "$env:USERPROFILE\.dsh\profiles\web"
pnpm install
```

**③ 重启 dsh web + 硬刷新浏览器页面**(Ctrl+F5)。

### 方式 C:GitHub 依赖手动方式

在 `package.json` 里把依赖写成 GitHub 引用,然后同样执行 `pnpm install` + 重启 + 刷新:

```json
{
  "dependencies": {
    "dsh-sticky-notes": "github:charrywhite/dsh-sticky-notes#commit哈希或分支"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-sticky-notes"]
    }
  }
}
```

---

## 2. 使用指南

### 创建便签

点击右上角的「**＋ 新建便签**」按钮,弹出菜单选择:

| 选项 | 说明 |
|------|------|
| 📝 文字便签 | 输入框打字,回车或点「添加」变成一条待办 |
| 🖼 图片便签 | 点击上传区选择图片,或直接把图片拖进便签 |

新便签默认从右上角层叠排开,每张都有标题栏、计数徽章和操作按钮。

### 便签操作

| 操作 | 方式 |
|------|------|
| 拖动 | 按住**标题栏**(或收起后的小标签、新建按钮)拖动,位置自动记住 |
| 勾选完成 | 点条目左侧复选框 → 删除线 + 变淡;再点取消 |
| 删除单条 | 鼠标悬停条目,点右侧 `×` |
| 清除已完成 | 便签底部「清除已完成」一键清理勾选项 |
| 换皮肤 | 点标题栏 🎨,弹出 9 色色块,点选即换(每张便签独立) |
| 重命名 | 点标题栏 ✏️,输入新名字,回车/失焦保存;清空可留白 |
| 收起/展开 | 点标题栏 `—` 收起为小圆标,单击小圆标展开 |
| 自动收边 | 视口变小(如大屏切到手机)时,跑出屏幕的便签自动收起并贴回最近的屏幕边缘;「新建便签」按钮同理回到默认位置 |
| 删除整张 | 点标题栏 🗑(有确认弹窗) |

### 图片便签

- 上传后图片显示在便签纸内,点击图片可更换
- 图片便签同样支持拖动、换皮肤、重命名、收起、删除

---

## 3. AI 模型读写便签

插件注册了两个模型工具,DeepSeek 模型在对话中可以直接调用:

### 读取:`sticky_notes_read`

列出所有便签:标题、每条文字、完成状态(☐/☑)、皮肤、是否收起。图片便签只显示元数据(标题/是否有图)。

**用法**:对模型说「看一下我的便签」「帮我整理便签」「按便签干活」。

### 写入:`sticky_notes_add`

- **新建便签**:不传 `noteId`,传 `text`(必填)+ 可选 `title`
- **追加条目**:传 `noteId`(先用 `sticky_notes_read` 拿到)+ `text`

**设计约束**:只允许追加/新建,**不能修改或删除已有内容**,不会覆盖你手动编辑的东西;图片便签拒绝追加文字条目。

**用法**:对模型说「帮我在便签上记一条:明天下午三点开会」「把这个需求加到工作便签里」。

---

## 4. 卸载

1. 方式 A 安装的:`dsh plugin --profile web remove dsh-sticky-notes`
2. 方式 B/C 安装的:从 `package.json` 移除依赖项和 bundles 条目,再执行 `pnpm install`
3. (可选)删除数据文件:`Remove-Item "$env:USERPROFILE\.dsh\sticky-notes.json"`
4. 重启 dsh web

---

## 环境要求

- DeepSeek Harness **web 模式**(`dsh web`)
- 浏览器:现代 Chromium/Firefox/Safari
- 无第三方运行时依赖

## License

MIT
