import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectGlobalHooks, detectProjectHooks } from '../../src/detectors/hooks.js'

vi.mock('../../src/config/claude.js', () => ({
  getGlobalClaudeDir: vi.fn(() => '/home/testuser/.claude'),
  readGlobalSettings: vi.fn(),
  readProjectMcp: vi.fn(),
  readProjectSettings: vi.fn(),
}))

import { readGlobalSettings, readProjectSettings } from '../../src/config/claude.js'

const mockReadGlobalSettings = vi.mocked(readGlobalSettings)
const mockReadProjectSettings = vi.mocked(readProjectSettings)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('detectGlobalHooks', () => {
  it('settings.json 不存在时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue(null)
    const result = await detectGlobalHooks()
    expect(result).toEqual([])
  })

  it('settings.json 没有 hooks 字段时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue({ mcpServers: {} })
    const result = await detectGlobalHooks()
    expect(result).toEqual([])
  })

  it('hooks 为数组时返回空数组', async () => {
    mockReadGlobalSettings.mockResolvedValue({ hooks: [] })
    const result = await detectGlobalHooks()
    expect(result).toEqual([])
  })

  it('正确解析 hooks 字段，数组形式', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      hooks: {
        'pre-tool-use': [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'format' }] },
        ],
        'post-tool-use': [
          { matcher: 'Write', hooks: [{ type: 'command', command: 'lint' }] },
        ],
      },
    })
    const result = await detectGlobalHooks()
    expect(result).toHaveLength(2)
    expect(result[0]?.event).toBe('pre-tool-use')
    expect(result[0]?.name).toBe('Bash')
    expect(result[0]?.scope).toBe('global')
    expect(result[1]?.event).toBe('post-tool-use')
    expect(result[1]?.name).toBe('Write')
  })

  it('所有条目的 scope 为 global', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      hooks: {
        'pre-tool-use': [{ matcher: 'Bash', hooks: [] }],
      },
    })
    const result = await detectGlobalHooks()
    expect(result.every((r) => r.scope === 'global')).toBe(true)
  })

  it('hook 项没有 matcher 时使用索引作为名称', async () => {
    mockReadGlobalSettings.mockResolvedValue({
      hooks: {
        'pre-tool-use': [{ hooks: [{ type: 'command', command: 'format' }] }],
      },
    })
    const result = await detectGlobalHooks()
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('hook-0')
  })
})

describe('detectProjectHooks', () => {
  it('settings.json 不存在时返回空数组', async () => {
    mockReadProjectSettings.mockResolvedValue(null)
    const result = await detectProjectHooks('/some/project')
    expect(result).toEqual([])
  })

  it('正确解析项目级 hooks', async () => {
    mockReadProjectSettings.mockResolvedValue({
      hooks: {
        'pre-tool-use': [{ matcher: 'Write', hooks: [] }],
      },
    })
    const result = await detectProjectHooks('/some/project')
    expect(result).toHaveLength(1)
    expect(result[0]?.event).toBe('pre-tool-use')
    expect(result[0]?.name).toBe('Write')
    expect(result[0]?.scope).toBe('project')
  })

  it('所有条目的 scope 为 project', async () => {
    mockReadProjectSettings.mockResolvedValue({
      hooks: {
        'post-tool-use': [{ matcher: 'Bash', hooks: [] }],
      },
    })
    const result = await detectProjectHooks('/some/project')
    expect(result.every((r) => r.scope === 'project')).toBe(true)
  })
})
