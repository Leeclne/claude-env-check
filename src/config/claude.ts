import { homedir } from 'os'
import { join } from 'path'
import { readFile } from 'fs/promises'

export function getGlobalClaudeDir(): string {
  return join(homedir(), '.claude')
}

export async function readGlobalSettings(): Promise<Record<string, unknown> | null> {
  const settingsPath = join(getGlobalClaudeDir(), 'settings.json')
  try {
    const raw = await readFile(settingsPath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function readProjectMcp(projectDir: string): Promise<Record<string, unknown> | null> {
  const mcpPath = join(projectDir, '.mcp.json')
  try {
    const raw = await readFile(mcpPath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function readProjectSettings(projectDir: string): Promise<Record<string, unknown> | null> {
  const settingsPath = join(projectDir, '.claude', 'settings.json')
  try {
    const raw = await readFile(settingsPath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}
