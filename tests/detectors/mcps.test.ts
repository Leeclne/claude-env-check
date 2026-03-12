import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectGlobalMcps, detectProjectMcps, detectAllMcps } from '../../src/detectors/mcps.js'

vi.mock('../../src/config/claude.js', () => ({
  getGlobalClaudeDir: vi.fn(() => '/home/testuser/.claude'),
  readGlobalSettings: vi.fn(),
  readProjectMcp: vi.fn(),
  readProjectSettings: vi.fn(),
}))

import { readGlobalSettings, readProjectMcp } from '../../src/config/claude.js'

const mockReadGlobalSettings = vi.mocked(readGlobalSettings)
const mockReadProjectMcp = vi.mocked(readProjectMcp)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('detectGlobalMcps', () => {
  it('settings.json 不存在时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue(null)
    const result = await detectGlobalMcps()
    expect(result).toEqual([])
  })

  it('settings.json 没有 mcpServers 字段时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue({ hooks: {} })
    const result = await detectGlobalMcps()
    expect(result).toEqual([])
  })

  it('正确解析 mcpServers 字段的 key 列表', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      mcpServers: {
        filesystem: { command: 'npx', args: [] },
        github: { command: 'npx', args: [] },
      },
    })
    const result = await detectGlobalMcps()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'filesystem', scope: 'global' })
    expect(result[1]).toEqual({ name: 'github', scope: 'global' })
  })

  it('mcpServers 为数组时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue({ mcpServers: [] })
    const result = await detectGlobalMcps()
    expect(result).toEqual([])
  })

  it('所有条目的 scope 为 global', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      mcpServers: { a: {}, b: {} },
    })
    const result = await detectGlobalMcps()
    expect(result.every((r) => r.scope === 'global')).toBe(true)
  })
})

describe('detectProjectMcps', () => {
  it('.mcp.json 不存在时返回空数组', async () => {
    mockReadProjectMcp.mockResolvedValue(null)
    const result = await detectProjectMcps('/some/project')
    expect(result).toEqual([])
  })

  it('正确解析 .mcp.json 的 mcpServers 字段', async () => {
    mockReadProjectMcp.mockResolvedValue({
      mcpServers: {
        postgres: { command: 'npx', args: [] },
        sqlite: { command: 'npx', args: [] },
      },
    })
    const result = await detectProjectMcps('/some/project')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'postgres', scope: 'project' })
    expect(result[1]).toEqual({ name: 'sqlite', scope: 'project' })
  })

  it('所有条目的 scope 为 project', async () => {
    mockReadProjectMcp.mockResolvedValue({
      mcpServers: { a: {}, b: {} },
    })
    const result = await detectProjectMcps('/some/project')
    expect(result.every((r) => r.scope === 'project')).toBe(true)
  })
})

describe('detectAllMcps', () => {
  it('合并全局和项目级 MCPs', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      mcpServers: { filesystem: {}, github: {} },
    })
    mockReadProjectMcp.mockResolvedValue({
      mcpServers: { postgres: {} },
    })
    const result = await detectAllMcps('/some/project')
    expect(result).toHaveLength(3)
  })

  it('项目级和全局重复时去重，项目级优先', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      mcpServers: { filesystem: {}, github: {} },
    })
    mockReadProjectMcp.mockResolvedValue({
      mcpServers: { filesystem: {} },
    })
    const result = await detectAllMcps('/some/project')
    const filesystem = result.find((r) => r.name === 'filesystem')
    expect(filesystem?.scope).toBe('project')
    expect(result).toHaveLength(2)
  })

  it('不传 projectDir 时只返回全局 MCPs', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      mcpServers: { filesystem: {} },
    })
    const result = await detectAllMcps()
    expect(result).toHaveLength(1)
    expect(result[0]?.scope).toBe('global')
  })
})
