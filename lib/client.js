// dsh-sticky-notes client half(静态插件,随 dsh web 包常驻 —— 刷新页面便签不丢)
// 多张独立便签:每张纸有自己的内容、勾选删除线、位置、皮肤、收起状态;
// 右上角「＋ 新建便签」创建新纸,标题栏 🗑 删除整张。数据整体持久化到 localStorage。
window.__ModuleLoader__.load({
  id: 'dsh-sticky-notes',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    const React = require('react')

    // ---- 皮肤预设(id / 名称 / CSS 变量值) ----
    // 4 款基础色 + 5 款风格化;onAccent 是强调色上的文字/勾选颜色。
    const SKINS = [
      { id: 'yellow', name: '经典黄', bgTop: '#fef9c3', bgBottom: '#fef3c7', border: 'rgba(180,140,40,.35)', title: '#713f12', text: '#451a03', muted: '#a16207', accent: '#d97706', onAccent: '#ffffff', accentSoft: 'rgba(217,119,6,.12)', field: '#fffbeb', line: 'rgba(146,106,20,.4)', shadow: 'rgba(60,40,10,.22)' },
      { id: 'green', name: '薄荷绿', bgTop: '#d1fae5', bgBottom: '#bbf7d0', border: 'rgba(4,120,87,.35)', title: '#065f46', text: '#064e3b', muted: '#047857', accent: '#059669', onAccent: '#ffffff', accentSoft: 'rgba(5,150,105,.12)', field: '#ecfdf5', line: 'rgba(4,120,87,.4)', shadow: 'rgba(6,78,59,.18)' },
      { id: 'pink', name: '樱花粉', bgTop: '#fce7f3', bgBottom: '#fbcfe8', border: 'rgba(190,24,93,.35)', title: '#9d174d', text: '#831843', muted: '#db2777', accent: '#db2777', onAccent: '#ffffff', accentSoft: 'rgba(219,39,119,.12)', field: '#fdf2f8', line: 'rgba(190,24,93,.4)', shadow: 'rgba(131,24,67,.18)' },
      { id: 'blue', name: '天空蓝', bgTop: '#dbeafe', bgBottom: '#bfdbfe', border: 'rgba(29,78,216,.35)', title: '#1d4ed8', text: '#1e3a8a', muted: '#2563eb', accent: '#2563eb', onAccent: '#ffffff', accentSoft: 'rgba(37,99,235,.12)', field: '#eff6ff', line: 'rgba(29,78,216,.4)', shadow: 'rgba(30,58,138,.18)' },
      { id: 'violet', name: '暮光紫', bgTop: '#ede9fe', bgBottom: '#ddd6fe', border: 'rgba(109,40,217,.35)', title: '#6d28d9', text: '#4c1d95', muted: '#7c3aed', accent: '#7c3aed', onAccent: '#ffffff', accentSoft: 'rgba(124,58,237,.12)', field: '#f5f3ff', line: 'rgba(109,40,217,.4)', shadow: 'rgba(76,29,149,.18)' },
      { id: 'orange', name: '暖橙日落', bgTop: '#ffedd5', bgBottom: '#fed7aa', border: 'rgba(194,65,12,.35)', title: '#c2410c', text: '#7c2d12', muted: '#ea580c', accent: '#ea580c', onAccent: '#ffffff', accentSoft: 'rgba(234,88,12,.12)', field: '#fff7ed', line: 'rgba(194,65,12,.4)', shadow: 'rgba(124,45,18,.18)' },
      { id: 'dark', name: '石墨暗夜', bgTop: '#1f2937', bgBottom: '#111827', border: 'rgba(148,163,184,.3)', title: '#e5e7eb', text: '#d1d5db', muted: '#94a3b8', accent: '#38bdf8', onAccent: '#082f49', accentSoft: 'rgba(56,189,248,.14)', field: '#0f172a', line: 'rgba(148,163,184,.3)', shadow: 'rgba(0,0,0,.4)' },
      { id: 'neon', name: '霓虹荧光', bgTop: '#18181b', bgBottom: '#09090b', border: 'rgba(163,230,53,.35)', title: '#fef08a', text: '#e7e5e4', muted: '#a3a3a3', accent: '#a3e635', onAccent: '#052e16', accentSoft: 'rgba(163,230,53,.14)', field: '#101012', line: 'rgba(163,230,53,.3)', shadow: 'rgba(163,230,53,.08)' },
      { id: 'paper', name: '极简白纸', bgTop: '#ffffff', bgBottom: '#f8fafc', border: 'rgba(100,116,139,.25)', title: '#0f172a', text: '#334155', muted: '#64748b', accent: '#64748b', onAccent: '#ffffff', accentSoft: 'rgba(100,116,139,.12)', field: '#ffffff', line: 'rgba(100,116,139,.3)', shadow: 'rgba(15,23,42,.12)' },
    ]
    const skinVarsOf = (s) => ({
      '--dsn-bg-top': s.bgTop,
      '--dsn-bg-bottom': s.bgBottom,
      '--dsn-border': s.border,
      '--dsn-shadow': s.shadow,
      '--dsn-title': s.title,
      '--dsn-text': s.text,
      '--dsn-muted': s.muted,
      '--dsn-accent': s.accent,
      '--dsn-on-accent': s.onAccent,
      '--dsn-accent-soft': s.accentSoft,
      '--dsn-field': s.field,
      '--dsn-line': s.line,
    })

    // ---- 样式(document.head 注入;颜色全部走 CSS 变量,回退到经典黄) ----
    const css = `
.dsn-board{position:fixed;inset:0;z-index:100;pointer-events:none}
.dsn-newbox{position:absolute;right:20px;top:30px;pointer-events:auto;z-index:6;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
.dsn-newbox:active{cursor:grabbing}
.dsn-new{display:block;font-size:12px;font-weight:600;color:#713f12;background:linear-gradient(180deg,#fef9c3,#fef3c7);border:1px solid rgba(180,140,40,.35);border-radius:99px;box-shadow:0 8px 20px rgba(60,40,10,.18);padding:6px 14px;cursor:pointer;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.dsn-new:hover{filter:brightness(.96)}
.dsn-newmenu{position:absolute;top:calc(100% + 6px);right:0;display:flex;flex-direction:column;gap:2px;background:#fffdf5;border:1px solid rgba(180,140,40,.35);border-radius:10px;box-shadow:0 10px 26px rgba(60,40,10,.2);padding:4px;min-width:132px}
.dsn-newmenu button{border:none;background:none;text-align:left;font-size:12px;color:#713f12;padding:7px 10px;border-radius:7px;cursor:pointer;font-family:inherit;white-space:nowrap}
.dsn-newmenu button:hover{background:rgba(217,119,6,.12)}
.dsn-root{position:absolute;width:264px;pointer-events:auto;display:flex;flex-direction:column;gap:8px;background:linear-gradient(180deg,var(--dsn-bg-top,#fef9c3),var(--dsn-bg-bottom,#fef3c7));border:1px solid var(--dsn-border,rgba(180,140,40,.35));border-radius:10px;box-shadow:0 12px 32px var(--dsn-shadow,rgba(60,40,10,.22)),0 2px 6px rgba(60,40,10,.12);padding:10px 10px 8px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;box-sizing:border-box;max-height:calc(100vh - 140px);will-change:left,top}
.dsn-root *{box-sizing:border-box}
.dsn-head{display:flex;align-items:center;gap:6px;padding-bottom:6px;border-bottom:1px dashed var(--dsn-line,rgba(146,106,20,.4));cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none}
.dsn-head:active{cursor:grabbing}
.dsn-titlebox{display:flex;align-items:center;gap:4px;flex:1;min-width:0}
.dsn-title{font-size:13px;font-weight:700;color:var(--dsn-title,#713f12);letter-spacing:.02em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsn-pen{width:20px;height:20px;border:none;background:none;cursor:pointer;color:var(--dsn-muted,#a16207);font-size:11px;line-height:1;border-radius:6px;flex-shrink:0;padding:0;opacity:.55;transition:opacity .12s,background .12s}
.dsn-pen:hover{opacity:1;background:var(--dsn-accent-soft,rgba(217,119,6,.18))}
.dsn-title-input{flex:1;min-width:0;font-size:13px;font-weight:700;color:var(--dsn-title,#713f12);background:var(--dsn-field,#fffbeb);border:1px solid var(--dsn-accent,#d97706);border-radius:6px;padding:2px 6px;outline:none;font-family:inherit}
.dsn-count{font-size:11px;color:var(--dsn-muted,#a16207);background:var(--dsn-accent-soft,rgba(217,119,6,.12));border-radius:99px;padding:1px 8px;flex-shrink:0}
.dsn-icon{width:22px;height:22px;border:none;background:none;cursor:pointer;color:var(--dsn-muted,#a16207);font-size:13px;line-height:1;border-radius:6px;flex-shrink:0;padding:0}
.dsn-icon:hover{background:var(--dsn-accent-soft,rgba(217,119,6,.18));color:var(--dsn-title,#713f12)}
.dsn-skins{display:flex;flex-wrap:wrap;gap:6px;padding-top:6px;border-top:1px dashed var(--dsn-line,rgba(146,106,20,.4))}
.dsn-skin-btn{width:26px;height:26px;border-radius:8px;border:1.5px solid rgba(120,120,120,.35);cursor:pointer;padding:0;flex-shrink:0;transition:transform .1s}
.dsn-skin-btn:hover{transform:scale(1.12)}
.dsn-skin-btn.on{border-color:var(--dsn-accent,#d97706);box-shadow:0 0 0 2px var(--dsn-accent-soft,rgba(217,119,6,.25))}
.dsn-input{display:flex;gap:6px}
.dsn-field{flex:1;min-width:0;font-size:13px;padding:6px 9px;border:1px solid var(--dsn-border,rgba(180,140,40,.4));border-radius:7px;background:var(--dsn-field,#fffbeb);color:var(--dsn-text,#451a03);outline:none;font-family:inherit}
.dsn-field:focus{border-color:var(--dsn-accent,#d97706);box-shadow:0 0 0 2px var(--dsn-accent-soft,rgba(217,119,6,.18))}
.dsn-field::placeholder{color:var(--dsn-muted,#a16207)}
.dsn-add{font-size:12px;font-weight:600;padding:0 12px;border:none;border-radius:7px;background:var(--dsn-accent,#d97706);color:var(--dsn-on-accent,#ffffff);cursor:pointer;flex-shrink:0;font-family:inherit}
.dsn-add:hover:not(:disabled){filter:brightness(.92)}
.dsn-add:disabled{opacity:.45;cursor:not-allowed}
.dsn-list{display:flex;flex-direction:column;gap:2px;overflow-y:auto;min-height:0;padding-right:2px}
.dsn-list::-webkit-scrollbar{width:6px}
.dsn-list::-webkit-scrollbar-thumb{background:var(--dsn-line,rgba(146,106,20,.3));border-radius:99px}
.dsn-empty{font-size:12px;color:var(--dsn-muted,#a16207);text-align:center;padding:14px 0 10px;opacity:.8}
.dsn-item{display:flex;align-items:flex-start;gap:7px;padding:4px 5px;border-radius:7px;transition:background .12s}
.dsn-item:hover{background:var(--dsn-accent-soft,rgba(217,119,6,.1))}
.dsn-check{position:relative;flex-shrink:0;width:16px;height:16px;margin-top:1px;cursor:pointer}
.dsn-check input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}
.dsn-box{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1.5px solid var(--dsn-accent,#a16207);border-radius:4px;background:var(--dsn-field,#fffbeb);font-size:11px;line-height:1;color:var(--dsn-on-accent,#ffffff);transition:background .12s,border-color .12s}
.dsn-check input:checked+.dsn-box{background:var(--dsn-accent,#d97706);border-color:var(--dsn-accent,#d97706)}
.dsn-check input:focus-visible+.dsn-box{box-shadow:0 0 0 2px var(--dsn-accent-soft,rgba(217,119,6,.3))}
.dsn-text{flex:1;min-width:0;font-size:13px;line-height:1.45;color:var(--dsn-text,#451a03);word-break:break-word;white-space:pre-wrap;transition:opacity .15s}
.dsn-item.done .dsn-text{text-decoration:line-through;text-decoration-thickness:1.5px;text-decoration-color:var(--dsn-accent,#b45309);opacity:.55}
.dsn-del{flex-shrink:0;width:18px;height:18px;border:none;background:none;color:var(--dsn-muted,#b45309);font-size:14px;line-height:1;cursor:pointer;border-radius:5px;opacity:0;transition:opacity .12s;padding:0}
.dsn-item:hover .dsn-del{opacity:1}
.dsn-del:hover{background:var(--dsn-accent-soft,rgba(180,83,9,.15));color:var(--dsn-title,#7c2d12)}
.dsn-foot{display:flex;justify-content:flex-end;padding-top:2px}
.dsn-clear{font-size:11px;color:var(--dsn-muted,#a16207);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;font-family:inherit}
.dsn-clear:hover{background:var(--dsn-accent-soft,rgba(217,119,6,.14));color:var(--dsn-title,#713f12)}
.dsn-imgbody{display:flex;align-items:center;justify-content:center;min-height:120px;max-height:calc(100vh - 260px);overflow:auto;border:1.5px dashed var(--dsn-line,rgba(146,106,20,.4));border-radius:8px;background:var(--dsn-field,#fffbeb);cursor:pointer;position:relative}
.dsn-imgbody:hover{border-color:var(--dsn-accent,#d97706)}
.dsn-img{max-width:100%;max-height:calc(100vh - 280px);border-radius:6px;display:block;object-fit:contain}
.dsn-imgempty{font-size:12px;color:var(--dsn-muted,#a16207);text-align:center;padding:34px 12px;line-height:1.9;white-space:pre-line}
.dsn-tab{position:absolute;pointer-events:auto;font-size:13px;font-weight:600;color:var(--dsn-title,#713f12);background:linear-gradient(180deg,var(--dsn-bg-top,#fef9c3),var(--dsn-bg-bottom,#fef3c7));border:1px solid var(--dsn-border,rgba(180,140,40,.35));border-radius:99px;box-shadow:0 8px 20px var(--dsn-shadow,rgba(60,40,10,.2));padding:7px 14px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;will-change:left,top}
.dsn-tab:active{cursor:grabbing}
.dsn-tab:hover{filter:brightness(.98)}
`

    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="dsh-sticky-notes/css"]') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-sticky-notes'
      tag.dataset.pluginCss = 'dsh-sticky-notes/css'
      tag.textContent = css
      document.head.appendChild(tag)
    }

    const h = (type, props, ...children) => React.createElement(type, props, ...children)

    // ---- 便签板数据(localStorage 持久化;v1 单便签数据自动迁移) ----
    const BOARD_KEY = 'dsh-sticky-notes:board:v1'
    const LEGACY_KEYS = ['dsh-sticky-notes:v1', 'dsh-sticky-notes:pos:v1', 'dsh-sticky-notes:skin:v1']
    function freshNote(id, kind) {
      /* kind: 'text' 文字便签 | 'image' 图片便签;title 自定义标题(null = 默认「便签 N」) */
      return { id, kind: kind === 'image' ? 'image' : 'text', title: null, items: [], image: null, skin: 'yellow', pos: null, collapsed: false }
    }
    function sanitizeNote(n) {
      if (!n || typeof n.id !== 'string') return null
      const kind = n.kind === 'image' ? 'image' : 'text'
      /* title:null = 从未自定义(显示默认「便签 N」);'' = 用户清空(标题没有字) */
      const title = typeof n.title === 'string' ? n.title.trim() : null
      const items = Array.isArray(n.items)
        ? n.items.filter((i) => i && typeof i.text === 'string').map((i) => ({ id: String(i.id || Math.random().toString(36).slice(2, 8)), text: i.text, done: !!i.done }))
        : []
      const image = typeof n.image === 'string' && n.image.length > 0 ? n.image : null
      const skin = SKINS.some((s) => s.id === n.skin) ? n.skin : 'yellow'
      let pos = null
      if (n.pos && typeof n.pos.x === 'number' && typeof n.pos.y === 'number') pos = { x: n.pos.x, y: n.pos.y }
      /* 注意:id 必须写全 n.id(此处不是局部变量,简写会抛 ReferenceError) */
      return { id: n.id, kind, title, items, image, skin, pos, collapsed: !!n.collapsed }
    }
    function loadBoard() {
      try {
        const raw = localStorage.getItem(BOARD_KEY)
        if (raw) {
          const b = JSON.parse(raw)
          const notes = Array.isArray(b && b.notes) ? b.notes.map(sanitizeNote).filter(Boolean) : []
          console.log('[dsh-sticky-notes] 从 localStorage 加载', notes.length, '张便签')
          /* 有存储记录就返回(允许空数组 = 用户删光了便签,刷新不该复活默认便签) */
          return notes
        }
        console.log('[dsh-sticky-notes] localStorage 无便签数据,创建默认空便签')
      } catch (e) {
        console.warn('[dsh-sticky-notes] localStorage 读取失败:', e && e.message ? e.message : e)
      }
      /* v1 迁移:旧单便签(items/skin/pos)变成第一张纸 */
      try {
        const raw = localStorage.getItem('dsh-sticky-notes:v1')
        if (raw) {
          const items = JSON.parse(raw)
          const note = freshNote('n-migrated')
          if (Array.isArray(items)) note.items = items.filter((i) => i && typeof i.text === 'string').map((i) => ({ id: String(i.id || Math.random().toString(36).slice(2, 8)), text: i.text, done: !!i.done }))
          const skinId = localStorage.getItem('dsh-sticky-notes:skin:v1')
          if (skinId && SKINS.some((s) => s.id === skinId)) note.skin = skinId
          try {
            const p = JSON.parse(localStorage.getItem('dsh-sticky-notes:pos:v1'))
            if (p && typeof p.x === 'number' && typeof p.y === 'number') note.pos = { x: p.x, y: p.y }
          } catch (e2) { /* 忽略 */ }
          for (const k of LEGACY_KEYS) localStorage.removeItem(k)
          return [note]
        }
      } catch (e) { /* 忽略 */ }
      return [freshNote('n1')]
    }
    function saveBoard(notes) {
      try {
        const json = JSON.stringify({ notes })
        localStorage.setItem(BOARD_KEY, json)
        /* 写后立即读回验证:确保数据真正落盘(环境异常时立刻暴露,而不是刷新后才发现丢) */
        const back = localStorage.getItem(BOARD_KEY)
        if (back !== json) {
          console.error('[dsh-sticky-notes] 写入验证失败:localStorage 读取回内容不一致,数据未真正保存!')
        }
      } catch (e) {
        /* 写入失败必须可见(常见原因:图片便签太多超出 localStorage ~5MB 配额,或浏览器禁用了存储) */
        console.warn('[dsh-sticky-notes] localStorage 写入失败(内容可能无法在刷新后保留):', e && e.message ? e.message : e)
      }
    }

    // ---- 持久化:每次变更立即写入,不依赖页面关闭事件,保证刷新/重开不丢数据 ----
    function scheduleSave(notes) {
      saveBoard(notes)
    }

    // ---- 与 host 同步(权威存储在 ~/.dsh/sticky-notes.json;agent 通过 host 读写) ----
    // 浏览器每次变更 POST 全量;定时轮询 /rev,发现 agent 写入过就拉全量刷新 UI。
    async function apiFetch(path, body) {
      try {
        const res = await fetch(path, body === undefined ? {} : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) return null
        return await res.json()
      } catch (e) {
        return null
      }
    }
    /* 上传串行化:连续操作按顺序落盘,避免请求乱序导致 host 存到旧数据 */
    function makeUploader() {
      let chain = Promise.resolve()
      const lastRevRef = { current: 0 }
      const push = (notes) => {
        chain = chain.then(() =>
          apiFetch('/sticky-notes/api/state', { notes }).then((up) => {
            if (up && typeof up.rev === 'number') lastRevRef.current = up.rev
          }),
        )
      }
      return { push, lastRevRef }
    }

    // ---- 「新建便签」按钮位置(拖拽后持久化;null = 默认右上角) ----
    const NEWBTN_KEY = 'dsh-sticky-notes:newbtn:v1'
    function loadNewBtnPos() {
      try {
        const raw = localStorage.getItem(NEWBTN_KEY)
        const p = raw ? JSON.parse(raw) : null
        if (p && typeof p.x === 'number' && typeof p.y === 'number') return p
      } catch (e) { /* 忽略 */ }
      return null
    }
    function saveNewBtnPos(p) {
      try {
        if (p) localStorage.setItem(NEWBTN_KEY, JSON.stringify(p))
        else localStorage.removeItem(NEWBTN_KEY)
      } catch (e) { /* 忽略 */ }
    }

    // ---- 图片便签:读取文件并压缩为 dataURL(控制 localStorage 体积) ----
    function readImageFile(file, cb) {
      if (!file || !/^image\//.test(file.type)) {
        cb(null)
        return
      }
      const reader = new FileReader()
      reader.onerror = () => cb(null)
      reader.onload = () => {
        const raw = reader.result
        try {
          const img = new Image()
          img.onerror = () => cb(raw)
          img.onload = () => {
            try {
              const MAX = 1400
              const scale = Math.min(1, MAX / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
              if (scale >= 1) {
                cb(raw)
                return
              }
              const w = Math.round((img.naturalWidth || 0) * scale)
              const h = Math.round((img.naturalHeight || 0) * scale)
              const canvas = document.createElement('canvas')
              canvas.width = w
              canvas.height = h
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, w, h)
              cb(canvas.toDataURL('image/jpeg', 0.85))
            } catch (e) {
              cb(raw)
            }
          }
          img.src = raw
        } catch (e) {
          cb(raw)
        }
      }
      reader.readAsDataURL(file)
    }

    // ---- 单张便签纸(memo:只有这张纸的数据/位置/皮肤变化时才重渲染) ----
    const NoteCard = React.memo(function NoteCard(props) {
      const { note, index, onChange, onDelete } = props
      const [draft, setDraft] = React.useState('')
      const [skinOpen, setSkinOpen] = React.useState(false)
      const [localPos, setLocalPos] = React.useState(note.pos)
      const [editingTitle, setEditingTitle] = React.useState(false)
      const [titleDraft, setTitleDraft] = React.useState('')
      const dragRef = React.useRef(null)
      const suppressClick = React.useRef(false)
      const fileRef = React.useRef(null)
      const isImage = note.kind === 'image'

      const skin = SKINS.find((s) => s.id === note.skin) || SKINS[0]
      const pickSkin = (id) => {
        onChange(note.id, { skin: id })
        setSkinOpen(false)
      }

      /* title === null:从未自定义 → 默认「便签 N」;'' 或非空 → 显示自定义标题(可为空) */
      const titleText = note.title === null ? '便签 ' + (index + 1) : note.title

      /* 标题编辑:回车/失焦保存,ESC 取消;清空后标题保持为空(不再回退默认名) */
      const startEditTitle = () => {
        setTitleDraft(note.title === null ? '' : note.title)
        setEditingTitle(true)
      }
      const commitTitle = () => {
        onChange(note.id, { title: titleDraft.trim() })
        setEditingTitle(false)
      }
      const cancelTitle = () => setEditingTitle(false)

      const update = (next) => onChange(note.id, { items: next })
      const add = () => {
        const text = draft.trim()
        if (!text) return
        update([{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), text, done: false }, ...note.items])
        setDraft('')
      }
      const toggle = (id) => update(note.items.map((n) => (n.id === id ? { ...n, done: !n.done } : n)))
      const remove = (id) => update(note.items.filter((n) => n.id !== id))
      const clearDone = () => update(note.items.filter((n) => !n.done))

      // ---- 图片便签:选择文件 / 拖放上传 ----
      const handleImageFile = (file) => {
        readImageFile(file, (dataUrl) => {
          if (dataUrl) onChange(note.id, { image: dataUrl })
        })
      }
      const onPickImage = () => {
        if (fileRef.current) fileRef.current.click()
      }
      const onDropImage = (e) => {
        e.preventDefault()
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
        if (f) handleImageFile(f)
      }

      // ---- 拖拽:按住标题栏/收起标签移动,位置持久化 ----
      /* 性能:拖动过程直接改 DOM style,不走 React 渲染;松手才同步一次状态 */
      const onHeadDown = (e) => {
        if (e.target && e.target.closest && (e.target.closest('.dsn-icon') || e.target.closest('.dsn-title-input'))) return
        if (e.pointerType === 'mouse' && e.button !== 0) return
        const el = e.currentTarget
        const panel = el.classList.contains('dsn-tab') ? el : el.parentElement
        const rect = panel.getBoundingClientRect()
        dragRef.current = {
          panel,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          baseLeft: rect.left,
          baseTop: rect.top,
          moved: false,
          last: null,
        }
        try { el.setPointerCapture(e.pointerId) } catch (err) { /* 忽略 */ }
      }
      const onHeadMove = (e) => {
        const d = dragRef.current
        if (!d || d.pointerId !== e.pointerId) return
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
        d.moved = true
        const vw = window.innerWidth
        const vh = window.innerHeight
        const left = Math.min(Math.max(d.baseLeft + dx, -d.panel.offsetWidth + 48), vw - 48)
        const top = Math.min(Math.max(d.baseTop + dy, 0), vh - 40)
        d.last = { x: left, y: top }
        /* 直接写 DOM,避免每帧 React 渲染 */
        d.panel.style.left = left + 'px'
        d.panel.style.top = top + 'px'
        d.panel.style.zIndex = '10'
      }
      const onHeadUp = (e) => {
        const d = dragRef.current
        if (!d || d.pointerId !== e.pointerId) return
        dragRef.current = null
        const el = e.currentTarget
        try {
          if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        } catch (err) { /* 忽略 */ }
        if (d.moved && d.last) {
          d.panel.style.zIndex = ''
          setLocalPos(d.last)
          onChange(note.id, { pos: d.last })
          suppressClick.current = true
          setTimeout(() => { suppressClick.current = false }, 0)
        }
      }

      const doneCount = note.items.filter((n) => n.done).length
      /* 默认位置:右上角依次错开 36px,像贴纸层叠 */
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const left = localPos ? localPos.x : Math.max(8, vw - 20 - 264)
      const top = localPos ? localPos.y : 76 + (index % 6) * 36
      const panelStyle = {
        ...skinVarsOf(skin),
        left: left + 'px',
        top: top + 'px',
      }

      if (note.collapsed) {
        return h('div', {
          className: 'dsn-tab',
          'data-dsn-note': note.id,
          style: panelStyle,
          title: '展开便签',
          onPointerDown: onHeadDown,
          onPointerMove: onHeadMove,
          onPointerUp: onHeadUp,
          onPointerCancel: onHeadUp,
          onClick: () => {
            if (suppressClick.current) {
              suppressClick.current = false
              return
            }
            onChange(note.id, { collapsed: false })
          },
        },
          /* 空标题时标签也有可点击的兜底文案 */
          titleText
            ? titleText + (isImage ? '' : ' · ' + note.items.length)
            : (isImage ? '图片便签' : (note.items.length + ' 条')),
        )
      }

      return h('div', { className: 'dsn-root', 'data-dsn-note': note.id, style: panelStyle },
        h('div', { className: 'dsn-head', onPointerDown: onHeadDown, onPointerMove: onHeadMove, onPointerUp: onHeadUp, onPointerCancel: onHeadUp },
          editingTitle
            ? h('input', {
                className: 'dsn-title-input',
                value: titleDraft,
                autoFocus: true,
                onChange: (e) => setTitleDraft(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === 'Enter') commitTitle()
                  else if (e.key === 'Escape') cancelTitle()
                },
                onBlur: commitTitle,
              })
            : h('div', { className: 'dsn-titlebox' },
                h('span', { className: 'dsn-title' }, titleText),
                h('button', { className: 'dsn-icon dsn-pen', onClick: startEditTitle, title: '重命名' }, '✏️'),
              ),
          isImage
            ? h('span', { className: 'dsn-count' }, '图片')
            : h('span', { className: 'dsn-count' }, doneCount + '/' + note.items.length),
          h('button', { className: 'dsn-icon', onClick: () => setSkinOpen(!skinOpen), title: '换皮肤' }, '🎨'),
          h('button', { className: 'dsn-icon', onClick: () => onDelete(note.id), title: '删除这张便签' }, '🗑'),
          h('button', { className: 'dsn-icon', onClick: () => onChange(note.id, { collapsed: true }), title: '收起' }, '—'),
        ),
        skinOpen
          ? h('div', { className: 'dsn-skins' },
              SKINS.map((s) =>
                h('button', {
                  key: s.id,
                  className: 'dsn-skin-btn' + (s.id === note.skin ? ' on' : ''),
                  style: { background: 'linear-gradient(180deg,' + s.bgTop + ',' + s.bgBottom + ')' },
                  title: s.name,
                  onClick: () => pickSkin(s.id),
                }),
              ),
            )
          : null,
        isImage
          ? h('div', {
              className: 'dsn-imgbody',
              onClick: onPickImage,
              onDragOver: (e) => e.preventDefault(),
              onDrop: onDropImage,
              title: '点击选择图片,或把图片拖进来',
            },
              h('input', {
                ref: fileRef,
                type: 'file',
                accept: 'image/*',
                style: { display: 'none' },
                onChange: (e) => {
                  const f = e.target.files && e.target.files[0]
                  if (f) handleImageFile(f)
                  e.target.value = ''
                },
              }),
              note.image
                ? h('img', { className: 'dsn-img', src: note.image, alt: '便签图片', decoding: 'async' })
                : h('div', { className: 'dsn-imgempty' }, '🖼 点击上传图片\n或把图片拖到这里'),
            )
          : h('div', { className: 'dsn-input' },
              h('input', {
                className: 'dsn-field',
                value: draft,
                placeholder: '输入便签,回车添加…',
                onChange: (e) => setDraft(e.target.value),
                onKeyDown: (e) => { if (e.key === 'Enter') add() },
              }),
              h('button', { className: 'dsn-add', onClick: add, disabled: !draft.trim() }, '添加'),
            ),
        !isImage && h('div', { className: 'dsn-list' },
          note.items.length === 0
            ? h('div', { className: 'dsn-empty' }, '暂无便签,写一条吧 ✍️')
            : note.items.map((n) =>
                h('div', { className: 'dsn-item' + (n.done ? ' done' : ''), key: n.id },
                  h('label', { className: 'dsn-check' },
                    h('input', { type: 'checkbox', checked: !!n.done, onChange: () => toggle(n.id) }),
                    h('span', { className: 'dsn-box' }, n.done ? '✓' : ''),
                  ),
                  h('span', { className: 'dsn-text' }, n.text),
                  h('button', { className: 'dsn-del', onClick: () => remove(n.id), title: '删除' }, '×'),
                ),
              ),
        ),
        !isImage && note.items.some((n) => n.done)
          ? h('div', { className: 'dsn-foot' },
              h('button', { className: 'dsn-clear', onClick: clearDone }, '清除已完成'),
            )
          : null,
      )
    })

    // ---- 便签板(管理多张纸 + 可拖动的「新建便签」按钮) ----
    function NoteBoard() {
      const [notes, setNotes] = React.useState(loadBoard)
      const [newPos, setNewPos] = React.useState(loadNewBtnPos)
      const [newMenuOpen, setNewMenuOpen] = React.useState(false)
      const newDragRef = React.useRef(null)
      const newSuppressClick = React.useRef(false)
      const newBoxRef = React.useRef(null)
      /* notesRef 同步镜像:所有修改先落盘再 setState,保存不依赖 React 异步渲染,
         操作后立刻关页面也不会丢数据 */
      const notesRef = React.useRef(notes)
      notesRef.current = notes
      /* host 同步:串行上传队列 + 最新 rev 引用 */
      const uploader = React.useRef(null)
      if (uploader.current === null) uploader.current = makeUploader()

      /* 从 host 拉全量并采用(清洗后写入本地状态 + localStorage) */
      const adoptHostNotes = React.useCallback((hostNotes) => {
        const clean = (Array.isArray(hostNotes) ? hostNotes : []).map(sanitizeNote).filter(Boolean)
        notesRef.current = clean
        setNotes(clean)
        scheduleSave(clean)
      }, [])

      /* 挂载时:先同步一次 host(权威),然后每 3 秒轮询 rev 感知 agent 的写入 */
      React.useEffect(() => {
        let alive = true
        const syncOnce = async () => {
          const s = await apiFetch('/sticky-notes/api/state')
          if (!alive || !s) return
          if (Array.isArray(s.notes) && s.notes.length > 0) {
            /* host 有数据:以 host 为准(agent 可能已写入) */
            uploader.current.lastRevRef.current = typeof s.rev === 'number' ? s.rev : 0
            adoptHostNotes(s.notes)
          } else if (notesRef.current.length > 0) {
            /* host 为空但本地有:迁移上传(首次升级场景) */
            uploader.current.push(notesRef.current)
          }
        }
        syncOnce()
        const timer = setInterval(async () => {
          const r = await apiFetch('/sticky-notes/api/rev')
          if (!alive || !r || typeof r.rev !== 'number') return
          if (r.rev === uploader.current.lastRevRef.current) return
          uploader.current.lastRevRef.current = r.rev
          const s = await apiFetch('/sticky-notes/api/state')
          if (!alive || !s) return
          adoptHostNotes(s.notes)
        }, 3000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [adoptHostNotes])

      const commit = React.useCallback((next) => {
        scheduleSave(next)
        setNotes(next)
        uploader.current.push(next)
      }, [])

      /* ---- 响应式:视口变化后,把跑到屏幕外的便签自动收起并拉回可见边缘 ----
         触发时机:resize / orientationchange / 挂载后首帧(覆盖「大屏存好位置 → 小屏打开」)。
         判定:取 DOM 真实矩形与视口求交集,可见面积过小即视为「在屏幕外」。
         动作:collapsed = true(最小化)+ 位置移到离它最近的视口边缘。 */
      React.useEffect(() => {
        let timer = 0
        const reconcile = () => {
          const vw = window.innerWidth
          const vh = window.innerHeight
          const visArea = (r) => {
            const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0))
            const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
            return ix * iy
          }
          const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
          const edgeOf = (r) => {
            /* 便签中心离哪条边最近,就贴到哪条边(保持中心对齐) */
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dLeft = cx
            const dRight = vw - cx
            const dTop = cy
            const dBottom = vh - cy
            const min = Math.min(dLeft, dRight, dTop, dBottom)
            const w = Math.min(r.width, vw - 16)
            const h = Math.min(r.height, vh - 16)
            let x = 8
            let y = 8
            if (min === dRight) { x = vw - w - 8; y = clamp(cy - h / 2, 8, vh - h - 8) }
            else if (min === dTop) { y = 8; x = clamp(cx - w / 2, 8, vw - w - 8) }
            else if (min === dBottom) { y = vh - h - 8; x = clamp(cx - w / 2, 8, vw - w - 8) }
            else { x = 8; y = clamp(cy - h / 2, 8, vh - h - 8) }
            return { x, y }
          }
          const MIN_VIS = 24 * 24 /* 可见面积小于 24x24 视为「在屏幕外」 */

          /* 1)「新建便签」按钮跑出屏幕 → 重置回默认右上角 */
          const nb = newBoxRef.current
          if (nb) {
            const nr = nb.getBoundingClientRect()
            if (nr.width > 0 && nr.height > 0 && visArea(nr) < MIN_VIS) {
              setNewPos(null)
              saveNewBtnPos(null)
            }
          }

          /* 2)每张便签:完全看不见才处理;部分可见(比如拖到一半)不动 */
          const current = notesRef.current
          const next = current.map((n) => {
            if (!n.pos) return n /* 默认位置随视口实时计算,不会跑出去 */
            const el = document.querySelector('[data-dsn-note="' + String(n.id).replace(/"/g, '') + '"]')
            if (!el) return n
            const r = el.getBoundingClientRect()
            if (r.width <= 0 || r.height <= 0) return n
            if (visArea(r) >= MIN_VIS) return n /* 还看得见,不动 */
            const p = edgeOf(r)
            return { ...n, collapsed: true, pos: p }
          })
          const changed = next.some((n, i) => n !== current[i])
          if (changed) commit(next)
        }
        const onResize = () => {
          window.clearTimeout(timer)
          /* 防抖:等 resize 风暴结束、布局稳定后再检查 */
          timer = window.setTimeout(reconcile, 150)
        }
        window.addEventListener('resize', onResize)
        window.addEventListener('orientationchange', onResize)
        /* 挂载后首帧检查一次:覆盖「大屏存位置 → 小屏打开页面」 */
        onResize()
        return () => {
          window.clearTimeout(timer)
          window.removeEventListener('resize', onResize)
          window.removeEventListener('orientationchange', onResize)
        }
      }, [commit])

      /* 所有回调 useCallback 稳定引用,配合 NoteCard 的 memo,只有变化的纸才重渲染 */
      const updateNote = React.useCallback((id, patch) => {
        const next = notesRef.current.map((n) => (n.id === id ? { ...n, ...patch } : n))
        commit(next)
      }, [commit])
      const addNote = React.useCallback((kind) => {
        const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        commit([...notesRef.current, freshNote(id, kind)])
        setNewMenuOpen(false)
      }, [commit])
      const deleteNote = React.useCallback((id) => {
        if (!window.confirm('删除这张便签?')) return
        commit(notesRef.current.filter((n) => n.id !== id))
      }, [commit])

      // ---- 「新建便签」按钮拖拽(window 级监听,不占用 pointer capture,
      //      避免抢走按钮的 click 导致按不动;拖动过程直接改 DOM 不走 React),位置持久化 ----
      const onNewDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        if (e.target && e.target.closest && e.target.closest('.dsn-newmenu')) return
        const box = newBoxRef.current
        if (!box) return
        const rect = box.getBoundingClientRect()
        newDragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          baseLeft: rect.left,
          baseTop: rect.top,
          width: rect.width,
          height: rect.height,
          moved: false,
          last: null,
        }
        const onMove = (ev) => {
          const d = newDragRef.current
          if (!d || d.pointerId !== ev.pointerId) return
          const dx = ev.clientX - d.startX
          const dy = ev.clientY - d.startY
          if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
          d.moved = true
          const vw = window.innerWidth
          const vh = window.innerHeight
          const left = Math.min(Math.max(d.baseLeft + dx, -d.width + 48), vw - 48)
          const top = Math.min(Math.max(d.baseTop + dy, 0), vh - 40)
          d.last = { x: left, y: top }
          const el = newBoxRef.current
          if (el) {
            el.style.left = left + 'px'
            el.style.top = top + 'px'
            el.style.right = 'auto'
          }
        }
        const onUp = (ev) => {
          const d = newDragRef.current
          if (!d || d.pointerId !== ev.pointerId) return
          newDragRef.current = null
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', onUp)
          if (d.moved && d.last) {
            setNewPos(d.last)
            saveNewBtnPos(d.last)
            newSuppressClick.current = true
            setTimeout(() => { newSuppressClick.current = false }, 0)
          }
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
      }
      const onNewClick = () => {
        if (newSuppressClick.current) {
          newSuppressClick.current = false
          return
        }
        setNewMenuOpen(!newMenuOpen)
      }

      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const newBtnStyle = newPos
        ? { left: newPos.x + 'px', top: newPos.y + 'px', right: 'auto' }
        : { right: '20px', top: '30px' }

      return h('div', { className: 'dsn-board' },
        h('div', {
          ref: newBoxRef,
          className: 'dsn-newbox',
          style: newBtnStyle,
          title: '新建便签(可拖动)',
          onPointerDown: onNewDown,
        },
          h('button', { className: 'dsn-new', onClick: onNewClick }, '＋ 新建便签'),
          newMenuOpen
            ? h('div', { className: 'dsn-newmenu' },
                h('button', { onClick: () => addNote('text') }, '📝 文字便签'),
                h('button', { onClick: () => addNote('image') }, '🖼 图片便签'),
              )
            : null,
        ),
        notes.map((n, i) =>
          h(NoteCard, {
            key: n.id,
            note: n,
            index: i,
            onChange: updateNote,
            onDelete: deleteNote,
          }),
        ),
      )
    }

    // ---- 模块导出 ----
    const inject = ['slots']
    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return

      slots.inject('shell.overlay', () => slots.register(
        { name: 'shell.overlay', id: 'sticky-notes', order: 5, label: '便签' },
        (props) => h(NoteBoard, props),
      ))

      console.log('dsh-sticky-notes client ready (static)')
    }

    exports.name = 'dsh-sticky-notes'
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
