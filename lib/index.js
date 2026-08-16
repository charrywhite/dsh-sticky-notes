// dsh-sticky-notes host half(静态插件,随 dsh web 常驻)
// 职责:
//   1. 权威存储:便签全量数据镜像到 ~/.dsh/sticky-notes.json(浏览器 localStorage 不再独占数据)
//   2. HTTP API:/sticky-notes/api/state(GET 读全量 / POST 浏览器上传),/sticky-notes/api/rev(轮询)
//   3. agent 模型工具:sticky_notes_read(感知便签)/ sticky_notes_add(只追加/新建,不覆盖已有内容)
// 依赖:零第三方依赖(node 内置模块 + webServer 服务 + tools 服务),与 lanpaint-dsh 同构。
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const name = 'dsh-sticky-notes'
export const inject = ['webServer']

// ---- 存储(权威文件;浏览器端只是缓存与渲染) ----
const DATA_DIR = join(homedir(), '.dsh')
const DATA_FILE = join(DATA_DIR, 'sticky-notes.json')

/** 内存态:{ notes, rev };rev 每次变更递增,浏览器据此轮询 agent 的写入 */
let state = { notes: [], rev: 0 }

async function loadFromDisk() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.notes)) {
      state = {
        notes: parsed.notes,
        rev: typeof parsed.rev === 'number' ? parsed.rev : 0,
      }
    }
  } catch (e) {
    /* 首次运行或文件损坏:保持空态 */
  }
}

async function saveToDisk() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(DATA_FILE, JSON.stringify({ notes: state.notes, rev: state.rev }), 'utf8')
  } catch (e) {
    console.error('[dsh-sticky-notes] host 写盘失败:', (e && e.message) || e)
  }
}

/** 新条目/便签 id(与 client 同风格) */
function freshId(prefix) {
  return (prefix || 'n') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 给模型看的摘要:便签 + 文字条目;图片便签只暴露元数据 */
function summaryForModel() {
  return state.notes.map((n, i) => ({
    id: n.id,
    title: n.title === null || n.title === undefined ? '便签 ' + (i + 1) : n.title,
    kind: n.kind === 'image' ? 'image' : 'text',
    collapsed: !!n.collapsed,
    skin: n.skin || 'yellow',
    hasImage: !!(n.kind === 'image' && n.image),
    items: Array.isArray(n.items)
      ? n.items.map((it) => ({ text: it.text, done: !!it.done }))
      : [],
  }))
}

// ---- HTTP 辅助 ----
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => resolve(data))
    req.on('error', () => resolve(''))
  })
}

/** 校验浏览器上传的便签结构(宽松清洗,避免坏数据进权威文件) */
function sanitizeNotes(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((n) => n && typeof n.id === 'string')
    .map((n) => ({
      id: n.id,
      kind: n.kind === 'image' ? 'image' : 'text',
      title: typeof n.title === 'string' ? n.title : null,
      items: Array.isArray(n.items)
        ? n.items.filter((i) => i && typeof i.text === 'string').map((i) => ({ id: String(i.id || freshId('i')), text: i.text, done: !!i.done }))
        : [],
      image: typeof n.image === 'string' && n.image.length > 0 ? n.image : null,
      skin: typeof n.skin === 'string' && n.skin ? n.skin : 'yellow',
      pos: n.pos && typeof n.pos.x === 'number' && typeof n.pos.y === 'number' ? { x: n.pos.x, y: n.pos.y } : null,
      collapsed: !!n.collapsed,
    }))
}

// ---- 插件主体 ----
export function apply(ctx) {
  // 启动时从磁盘恢复
  loadFromDisk().then(() => {
    console.log('[dsh-sticky-notes] host ready,', state.notes.length, 'notes, rev', state.rev)
  })

  // ---- HTTP API(浏览器 fetch 同源调用) ----
  ctx.webServer.register({
    kind: 'prefix',
    path: '/sticky-notes',
    handler: async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://x')
        const pathname = url.pathname
        const method = req.method || 'GET'

        // 轮询:只看 rev(轻量)
        if (pathname === '/sticky-notes/api/rev' && method === 'GET') {
          return sendJson(res, 200, { rev: state.rev, count: state.notes.length })
        }

        // 读全量(浏览器启动/轮询拉取)
        if (pathname === '/sticky-notes/api/state' && method === 'GET') {
          return sendJson(res, 200, { rev: state.rev, notes: state.notes })
        }

        // 浏览器上传全量(每次用户操作后)
        if (pathname === '/sticky-notes/api/state' && method === 'POST') {
          const body = JSON.parse(await readBody(req) || '{}')
          const notes = sanitizeNotes(body && body.notes)
          state.notes = notes
          state.rev = state.rev + 1
          await saveToDisk()
          return sendJson(res, 200, { ok: true, rev: state.rev })
        }

        return sendJson(res, 404, { error: 'not found: ' + pathname })
      } catch (e) {
        return sendJson(res, 500, { error: String((e && e.message) || e) })
      }
    },
  })

  // ---- 模型工具(失败不拖垮插件) ----
  try {
    const tools = ctx.get('tools')
    if (tools) {
      // 读便签:让 agent 感知
      tools.register({
        name: 'sticky_notes_read',
        description:
          '读取用户的便签板(dsh-sticky-notes 插件):返回所有便签的标题、文字条目、完成状态、皮肤、是否折叠。' +
          '图片便签只显示元数据(标题/是否有图),看不到图片内容。' +
          '在用户要求"看一下我的便签/帮我整理便签/按便签干活"时调用;写入请用 sticky_notes_add。',
        parameters: {
          type: 'object',
          properties: {},
        },
        output: {
          schema: { type: 'string' },
          render(_args, value) {
            return [{ type: 'text', text: String(value || '') }]
          },
        },
        async execute() {
          const lines = ['📝 便签板(' + state.notes.length + ' 张):']
          if (state.notes.length === 0) {
            lines.push('(空)')
          }
          state.notes.forEach((n, i) => {
            const title = n.title === null || n.title === undefined ? '便签 ' + (i + 1) : n.title
            lines.push('')
            lines.push('【' + title + '】(id=' + n.id + ', 皮肤=' + (n.skin || 'yellow') + (n.collapsed ? ', 已收起' : '') + ')')
            if (n.kind === 'image') {
              lines.push('  图片便签:有图片 ' + (n.image ? '✓' : '✗') + '(内容不可见)')
            }
            const items = Array.isArray(n.items) ? n.items : []
            if (items.length === 0) {
              lines.push('  (无条目)')
            }
            items.forEach((it) => {
              lines.push('  ' + (it.done ? '☑ ' : '☐ ') + it.text)
            })
          })
          return lines.join('\n')
        },
      })

      // 写便签:只允许追加条目 / 新建便签(不覆盖已有内容)
      tools.register({
        name: 'sticky_notes_add',
        description:
          '向用户的便签板(dsh-sticky-notes 插件)添加内容:新建一张便签,或在已有便签末尾追加一条待办。' +
          '只能追加/新建,不能修改或删除已有内容。' +
          '参数二选一:传 noteId 则向该便签追加条目(先调 sticky_notes_read 拿到 id);不传 noteId 则新建一张文字便签。' +
          'text 是必填的条目文字。title 仅新建时有效。',
        parameters: {
          type: 'object',
          properties: {
            noteId: { type: 'string', description: '目标便签 id;不传则新建一张便签' },
            title: { type: 'string', description: '新建便签时的标题(可选,缺省为默认名)' },
            text: { type: 'string', description: '要追加的条目文字(必填)' },
          },
          required: ['text'],
        },
        output: {
          schema: { type: 'string' },
          render(_args, value) {
            return [{ type: 'text', text: String(value || '') }]
          },
        },
        async execute(args) {
          const text = String((args && args.text) || '').trim()
          if (!text) return '❌ text 不能为空'
          const noteId = args && args.noteId ? String(args.noteId) : null
          const title = args && typeof args.title === 'string' && args.title.trim() ? args.title.trim() : null

          if (noteId) {
            const note = state.notes.find((n) => n.id === noteId)
            if (!note) {
              return '❌ 找不到便签 id=' + noteId + ',请先调 sticky_notes_read 获取有效 id'
            }
            if (note.kind === 'image') {
              return '❌ 这是图片便签,不能追加文字条目;请新建一张文字便签'
            }
            if (!Array.isArray(note.items)) note.items = []
            note.items.push({ id: freshId('i'), text, done: false })
            state.rev = state.rev + 1
            await saveToDisk()
            return '✅ 已向便签「' + (note.title || noteId) + '」追加:' + text + '(共 ' + note.items.length + ' 条)'
          }

          // 新建文字便签
          const newNote = {
            id: freshId('n'),
            kind: 'text',
            title,
            items: [{ id: freshId('i'), text, done: false }],
            image: null,
            skin: 'yellow',
            pos: null,
            collapsed: false,
          }
          state.notes.push(newNote)
          state.rev = state.rev + 1
          await saveToDisk()
          return '✅ 已新建便签「' + (title || '便签 ' + state.notes.length) + '」并写入:' + text + '(id=' + newNote.id + ')'
        },
      })
    }
  } catch (e) {
    console.error('[dsh-sticky-notes] tool register failed:', (e && e.message) || e)
  }
}
