# 📝 dsh-sticky-notes

DeepSeek Harness 便签插件(静态插件):一张张可拖动的便签纸,贴在对话框右侧空白处。

- **打字记录**:每张便签是一个待办列表,回车/按钮添加
- **勾选完成**:点复选框,文字出现删除线并变淡
- **多张便签**:右上角「＋ 新建便签」随意添加,每张完全独立
- **可拖动**:便签、收起的小标签、「新建便签」按钮都能拖到任意位置并记住
- **9 套皮肤**:经典黄、薄荷绿、樱花粉、天空蓝、暮光紫、暖橙日落、石墨暗夜、霓虹荧光、极简白纸
- **图片便签**:上传/拖入图片,便签纸里展示图片(自动压缩存储)
- **自定义标题**:✏️ 铅笔图标重命名,清空后标题可留白
- **AI 协同**:DeepSeek 模型可以直接**读**你的便签、帮你**写**便签(见下文)
- **数据可靠**:host 权威存储到 `~/.dsh/sticky-notes.json`,刷新/重开/换浏览器都不丢

---

## 1. 安装

### 方式 A:本地目录安装(开发/自用,推荐先这样)

把插件目录放到任意位置(下文以 `C:\path\to\dsh-plugin-sticky-notes` 为例),然后修改你的 web profile 配置。

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

**② 创建 node_modules 链接**

在 `%USERPROFILE%\.dsh\profiles\web\node_modules\` 下创建 junction,指向插件目录:

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-sticky-notes" -Target "C:\path\to\dsh-plugin-sticky-notes"
```

**③ 重启 dsh web**

```powershell
# 在启动 dsh web 的终端里 Ctrl+C 停止,然后重新启动
dsh web
```

**④ 硬刷新浏览器页面**(Ctrl+F5),右侧就会出现便签。

### 方式 B:从 GitHub 仓库安装(分发)

把本仓库克隆/下载后,在 `package.json` 里把依赖写成 GitHub 引用(与 `dsh-archived-sessions` 同款方式):

```json
{
  "dependencies": {
    "dsh-sticky-notes": "github:你的用户名/dsh-sticky-notes#commit哈希或分支"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-sticky-notes"]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install`(会解析 GitHub 依赖并建立链接),再重启 + 刷新。

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
| 删除整张 | 点标题栏 🗑(有确认弹窗) |

### 图片便签

- 上传后图片显示在便签纸内,点击图片可更换
- 图片会被压缩(最长边 1400px, JPEG 0.85)再存储,避免撑爆存储配额
- 图片便签同样支持拖动、换皮肤、重命名、收起、删除

---

## 3. AI 模型读写便签

插件 host 半注册了两个模型工具,DeepSeek 模型在对话中可以直接调用:

### 读取:`sticky_notes_read`

列出所有便签:标题、每条文字、完成状态(☐/☑)、皮肤、是否收起。图片便签只显示元数据(标题/是否有图)。

**用法**:对模型说「看一下我的便签」「帮我整理便签」「按便签干活」。

### 写入:`sticky_notes_add`

- **新建便签**:不传 `noteId`,传 `text`(必填)+ 可选 `title`
- **追加条目**:传 `noteId`(先用 `sticky_notes_read` 拿到)+ `text`

**设计约束**:只允许追加/新建,**不能修改或删除已有内容**,不会覆盖你手动编辑的东西;图片便签拒绝追加文字条目。

**用法**:对模型说「帮我在便签上记一条:明天下午三点开会」「把这个需求加到工作便签里」。

### 同步机制

```
浏览器 UI (client.js)                     Node host (index.js)
  便签界面 ◄─轮询 rev 每 3 秒─►  /sticky-notes/api/state  ◄─► ~/.dsh/sticky-notes.json
  每次操作立即 POST 全量 ───────────┘                            ▲
                                                    tools.register(sticky_notes_*)
                                                              │
                                                        模型(DeepSeek)
```

- **权威数据在 host 文件** `~/.dsh/sticky-notes.json`,浏览器只是渲染层 + 本地缓存
- 你在界面上的每次操作立即上传;模型写入后,页面 3 秒内自动刷新显示
- 首次从旧版升级时,浏览器会自动把 localStorage 里的便签迁移上传

---

## 4. 卸载

1. 从 `%USERPROFILE%\.dsh\profiles\web\package.json` 移除依赖项和 bundles 条目
2. 删除 junction:`Remove-Item "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-sticky-notes"`
3. (可选)删除数据文件:`Remove-Item "$env:USERPROFILE\.dsh\sticky-notes.json"`
4. 重启 dsh web

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `lib/client.js` | 浏览器端便签 UI:多便签、拖动、皮肤、图片、标题、与 host 同步 |
| `lib/index.js` | Node 端:权威存储(`~/.dsh/sticky-notes.json`)、HTTP API、模型工具 |
| `cordis.patch.yml` | 组合补丁:把插件行插入 profile 组合 |
| `package.json` | 包声明:`dsh.bundle.patch`(补丁)+ `dsh.client`(web 平台,立即加载) |

## 环境要求

- DeepSeek Harness **web 模式**(`dsh web`)
- 浏览器:现代 Chromium/Firefox/Safari
- 无第三方运行时依赖

## License

MIT
