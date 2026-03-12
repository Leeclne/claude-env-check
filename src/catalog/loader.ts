import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

export type CatalogItem = {
  name: string
  description: string
  source: 'official' | 'community'
  repo?: string
  package?: string
  stars?: number
  installs?: number
  /**
   * true = 由维护者手动维护 installs/stars，update-stats 脚本会跳过此条目
   * 适用于小众、个人或无法通过 npm/GitHub API 准确获取数据的项目
   */
  manualStats?: boolean
}

export type Catalog = {
  version: string
  updatedAt: string
  items: CatalogItem[]
}

function getCatalogDir(): string {
  // 支持 src/ 下运行（tsx dev）和 dist/ 下运行（编译后）
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  // src/catalog/loader.ts -> ../../catalog/
  // dist/catalog/loader.js -> ../../catalog/
  return join(__dirname, '..', '..', 'catalog')
}

export function loadSkillsCatalog(): Catalog {
  const catalogDir = getCatalogDir()
  const raw = readFileSync(join(catalogDir, 'skills.json'), 'utf-8')
  return JSON.parse(raw) as Catalog
}

export function loadMcpsCatalog(): Catalog {
  const catalogDir = getCatalogDir()
  const raw = readFileSync(join(catalogDir, 'mcps.json'), 'utf-8')
  return JSON.parse(raw) as Catalog
}
