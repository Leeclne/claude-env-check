import { join } from 'path'
import { readdir, stat } from 'fs/promises'
import { getGlobalClaudeDir } from '../config/claude.js'

export type SkillEntry = {
  name: string
  scope: 'global' | 'project'
}

async function scanSkillsDir(dir: string, scope: 'global' | 'project'): Promise<SkillEntry[]> {
  try {
    const entries = await readdir(dir)
    const results: SkillEntry[] = []
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        const s = await stat(fullPath)
        if (s.isDirectory()) {
          results.push({ name: entry, scope })
        }
      } catch {
        // 跳过无法读取的条目
      }
    }
    return results
  } catch {
    return []
  }
}

export async function detectGlobalSkills(): Promise<SkillEntry[]> {
  const dir = join(getGlobalClaudeDir(), 'skills')
  return scanSkillsDir(dir, 'global')
}

export async function detectProjectSkills(projectDir: string): Promise<SkillEntry[]> {
  const dir = join(projectDir, '.claude', 'skills')
  return scanSkillsDir(dir, 'project')
}
