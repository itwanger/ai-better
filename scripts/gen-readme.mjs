#!/usr/bin/env node
// 从 video/readme.md（站点上的题库总览）生成 README 里的分类统计表和题目目录。
// 用法：node scripts/gen-readme.mjs          重写 README.md 的自动生成区块
//       node scripts/gen-readme.mjs --check  只检查 README 是否和题库一致，不一致时退出码为 1
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = path.join(ROOT, 'video/readme.md')
const README = path.join(ROOT, 'README.md')
const SITE = 'https://javabetter.cn/ai/video'

const CATEGORY_RE = /^## (?:(\d+)、)?(.+?)（(\d+) 题）\s*$/
const QUESTION_RE = /^### (?:(\d+)\.\s*)?(.+?)\s*$/
const ARTICLE_RE = /\]\(\.\/([a-z0-9-]+)\.md\)/
const BILIBILI_RE = /https:\/\/www\.bilibili\.com\/video\/[A-Za-z0-9]+\/?/
const DOUYIN_RE = /https:\/\/www\.douyin\.com\/video\/\d+/
const LEVEL_RE = /^(🟢|🟡|🔴)/

function parseCatalog(text) {
  const categories = []
  let category = null
  let question = null

  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      const m = line.match(CATEGORY_RE)
      // 「## ending」等不带题数的二级标题是正文，不是分类，后面不再有题目
      category = m ? { no: m[1] ?? '', name: m[2].trim(), declared: Number(m[3]), questions: [] } : null
      if (category) categories.push(category)
      question = null
      continue
    }
    if (!category) continue

    const q = line.match(QUESTION_RE)
    if (q) {
      question = { no: q[1] ?? '', title: q[2], article: '', bilibili: '', douyin: '', level: '' }
      category.questions.push(question)
      continue
    }
    if (!question) continue

    question.article ||= line.match(ARTICLE_RE)?.[1] ?? ''
    question.bilibili ||= line.match(BILIBILI_RE)?.[0] ?? ''
    question.douyin ||= line.match(DOUYIN_RE)?.[0] ?? ''
    question.level ||= line.match(LEVEL_RE)?.[1] ?? ''
  }

  for (const c of categories) {
    if (c.questions.length !== c.declared) {
      throw new Error(`「${c.name}」标题写的是 ${c.declared} 题，实际解析到 ${c.questions.length} 题`)
    }
  }
  return categories
}

const hasVideo = (q) => Boolean(q.douyin || q.bilibili)
const label = (c) => (c.no ? `${c.no} ${c.name}` : c.name)

// 标题和网站、飞书保持同一个公式，题数随题库自动更新
function renderTitle(categories) {
  const total = categories.reduce((n, c) => n + c.questions.length, 0)
  return `<h1 align="center">王二讲Agent：AI Agent 面试题 ${total} 道（Agent八股+视频讲解）</h1>`
}

function renderStats(categories) {
  const all = categories.flatMap((c) => c.questions)
  const rows = categories.map((c) => {
    const articles = c.questions.filter((q) => q.article).length
    const videos = c.questions.filter(hasVideo).length
    return `| ${label(c)} | ${c.questions.length} | ${articles} | ${videos} |`
  })
  return [
    '| 分类 | 题数 | 图文详解 | 视频讲解 |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    `| **合计** | **${all.length}** | **${all.filter((q) => q.article).length}** | **${all.filter(hasVideo).length}** |`,
  ].join('\n')
}

function renderQuestion(q) {
  const no = q.no ? `${q.no}. ` : ''
  const title = q.article ? `[${q.title}](${SITE}/${q.article}.html)` : q.title
  const links = [q.douyin && `[抖音](${q.douyin})`, q.bilibili && `[B站](${q.bilibili})`].filter(Boolean)
  const level = q.level ? `${q.level} ` : ''
  return `- ${level}${no}${title}${links.length ? ` · ${links.join(' · ')}` : ''}`
}

function renderCatalog(categories) {
  return categories
    .map((c) => {
      const articles = c.questions.filter((q) => q.article).length
      return [
        '<details>',
        `<summary><b>${label(c)}</b>（${c.questions.length} 题，图文详解 ${articles} 篇）</summary>`,
        '',
        ...c.questions.map(renderQuestion),
        '',
        '</details>',
      ].join('\n')
    })
    .join('\n\n')
}

function replaceBlock(readme, name, body) {
  const start = `<!-- AUTO-GENERATED:${name}:START -->`
  const end = `<!-- AUTO-GENERATED:${name}:END -->`
  const from = readme.indexOf(start)
  const to = readme.indexOf(end)
  if (from === -1 || to === -1 || to < from) throw new Error(`README.md 缺少 ${start} / ${end} 标记`)
  return `${readme.slice(0, from + start.length)}\n${body}\n${readme.slice(to)}`
}

const categories = parseCatalog(fs.readFileSync(CATALOG, 'utf8'))
const current = fs.readFileSync(README, 'utf8')
let next = replaceBlock(current, 'TITLE', renderTitle(categories))
next = replaceBlock(next, 'STATS', renderStats(categories))
next = replaceBlock(next, 'CATALOG', renderCatalog(categories))

if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error('README.md 和 video/readme.md 不一致，请运行 node scripts/gen-readme.mjs')
    process.exit(1)
  }
  console.log('README.md 已是最新')
} else {
  fs.writeFileSync(README, next)
  const total = categories.reduce((n, c) => n + c.questions.length, 0)
  console.log(`已更新 README.md：${categories.length} 个分类，${total} 道题`)
}
