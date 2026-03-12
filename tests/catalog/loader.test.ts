import { describe, it, expect } from 'vitest'
import { loadSkillsCatalog, loadMcpsCatalog } from '../../src/catalog/loader.js'

describe('loadSkillsCatalog', () => {
  it('能正确加载 skills.json', () => {
    const catalog = loadSkillsCatalog()
    expect(catalog).toBeDefined()
    expect(typeof catalog.version).toBe('string')
    expect(typeof catalog.updatedAt).toBe('string')
    expect(Array.isArray(catalog.items)).toBe(true)
  })

  it('返回的 items 不为空', () => {
    const catalog = loadSkillsCatalog()
    expect(catalog.items.length).toBeGreaterThan(0)
  })

  it('每个 item 符合 CatalogItem 类型定义', () => {
    const catalog = loadSkillsCatalog()
    for (const item of catalog.items) {
      expect(typeof item.name).toBe('string')
      expect(typeof item.description).toBe('string')
      expect(['official', 'community']).toContain(item.source)
    }
  })

  it('包含 commit skill', () => {
    const catalog = loadSkillsCatalog()
    const commit = catalog.items.find((i) => i.name === 'commit')
    expect(commit).toBeDefined()
    expect(commit?.source).toBe('official')
  })

  it('包含 review-pr skill', () => {
    const catalog = loadSkillsCatalog()
    const reviewPr = catalog.items.find((i) => i.name === 'review-pr')
    expect(reviewPr).toBeDefined()
  })
})

describe('loadMcpsCatalog', () => {
  it('能正确加载 mcps.json', () => {
    const catalog = loadMcpsCatalog()
    expect(catalog).toBeDefined()
    expect(typeof catalog.version).toBe('string')
    expect(typeof catalog.updatedAt).toBe('string')
    expect(Array.isArray(catalog.items)).toBe(true)
  })

  it('返回的 items 不为空', () => {
    const catalog = loadMcpsCatalog()
    expect(catalog.items.length).toBeGreaterThan(0)
  })

  it('每个 item 符合 CatalogItem 类型定义', () => {
    const catalog = loadMcpsCatalog()
    for (const item of catalog.items) {
      expect(typeof item.name).toBe('string')
      expect(typeof item.description).toBe('string')
      expect(['official', 'community']).toContain(item.source)
    }
  })

  it('包含 filesystem MCP', () => {
    const catalog = loadMcpsCatalog()
    const fs = catalog.items.find((i) => i.name === 'filesystem')
    expect(fs).toBeDefined()
    expect(fs?.source).toBe('official')
    expect(fs?.package).toBe('@modelcontextprotocol/server-filesystem')
  })

  it('包含 github MCP', () => {
    const catalog = loadMcpsCatalog()
    const github = catalog.items.find((i) => i.name === 'github')
    expect(github).toBeDefined()
    expect(github?.package).toBe('@modelcontextprotocol/server-github')
  })

  it('官方 MCP 若有 package 字段则必须为字符串（部分为 Python 实现，无 npm 包）', () => {
    const catalog = loadMcpsCatalog()
    const officialItems = catalog.items.filter((i) => i.source === 'official')
    for (const item of officialItems) {
      if (item.package !== undefined) {
        expect(typeof item.package).toBe('string')
      }
    }
  })
})
