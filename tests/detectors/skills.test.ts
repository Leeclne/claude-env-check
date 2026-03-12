import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectGlobalSkills, detectProjectSkills } from '../../src/detectors/skills.js'

vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}))

vi.mock('../../src/config/claude.js', () => ({
  getGlobalClaudeDir: vi.fn(() => '/home/testuser/.claude'),
  readGlobalSettings: vi.fn(),
  readProjectMcp: vi.fn(),
  readProjectSettings: vi.fn(),
}))

import { readdir, stat } from 'fs/promises'

const mockReaddir = vi.mocked(readdir)
const mockStat = vi.mocked(stat)

function dirStat() {
  return { isDirectory: () => true } as Awaited<ReturnType<typeof stat>>
}

function fileStat() {
  return { isDirectory: () => false } as Awaited<ReturnType<typeof stat>>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('detectGlobalSkills', () => {
  it('目录不存在时返回空数组', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT: no such file or directory'))
    const result = await detectGlobalSkills()
    expect(result).toEqual([])
  })

  it('正确扫描子目录作为 skill 名称', async () => {
    mockReaddir.mockResolvedValue(['commit', 'review-pr', 'somefile.md'] as any)
    mockStat
      .mockResolvedValueOnce(dirStat())   // commit → 目录
      .mockResolvedValueOnce(dirStat())   // review-pr → 目录
      .mockResolvedValueOnce(fileStat())  // somefile.md → 文件，跳过
    const result = await detectGlobalSkills()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'commit', scope: 'global' })
    expect(result[1]).toEqual({ name: 'review-pr', scope: 'global' })
  })

  it('文件（非目录）不计入结果', async () => {
    mockReaddir.mockResolvedValue(['SKILL.md', 'some-skill'] as any)
    mockStat
      .mockResolvedValueOnce(fileStat())  // SKILL.md → 文件
      .mockResolvedValueOnce(dirStat())   // some-skill → 目录
    const result = await detectGlobalSkills()
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('some-skill')
  })

  it('所有条目的 scope 为 global', async () => {
    mockReaddir.mockResolvedValue(['a', 'b'] as any)
    mockStat.mockResolvedValue(dirStat())
    const result = await detectGlobalSkills()
    expect(result.every((r) => r.scope === 'global')).toBe(true)
  })
})

describe('detectProjectSkills', () => {
  it('目录不存在时返回空数组', async () => {
    mockReaddir.mockRejectedValue(new Error('ENOENT: no such file or directory'))
    const result = await detectProjectSkills('/some/project')
    expect(result).toEqual([])
  })

  it('正确扫描子目录', async () => {
    mockReaddir.mockResolvedValue(['deploy', 'test'] as any)
    mockStat.mockResolvedValue(dirStat())
    const result = await detectProjectSkills('/some/project')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'deploy', scope: 'project' })
    expect(result[1]).toEqual({ name: 'test', scope: 'project' })
  })

  it('所有条目的 scope 为 project', async () => {
    mockReaddir.mockResolvedValue(['a', 'b'] as any)
    mockStat.mockResolvedValue(dirStat())
    const result = await detectProjectSkills('/some/project')
    expect(result.every((r) => r.scope === 'project')).toBe(true)
  })

  it('目录为空时返回空数组', async () => {
    mockReaddir.mockResolvedValue([] as any)
    const result = await detectProjectSkills('/some/project')
    expect(result).toEqual([])
  })
})
