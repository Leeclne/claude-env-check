import { readGlobalSettings, readProjectMcp } from '../config/claude.js'

export type McpEntry = {
  name: string
  scope: 'global' | 'project'
}

export async function detectGlobalMcps(): Promise<McpEntry[]> {
  const settings = await readGlobalSettings()
  if (!settings) return []

  const mcpServers = settings['mcpServers']
  if (!mcpServers || typeof mcpServers !== 'object' || Array.isArray(mcpServers)) {
    return []
  }

  return Object.keys(mcpServers as Record<string, unknown>).map((name) => ({
    name,
    scope: 'global' as const,
  }))
}

export async function detectProjectMcps(projectDir: string): Promise<McpEntry[]> {
  const mcp = await readProjectMcp(projectDir)
  if (!mcp) return []

  const mcpServers = mcp['mcpServers']
  if (!mcpServers || typeof mcpServers !== 'object' || Array.isArray(mcpServers)) {
    return []
  }

  return Object.keys(mcpServers as Record<string, unknown>).map((name) => ({
    name,
    scope: 'project' as const,
  }))
}

export async function detectAllMcps(projectDir?: string): Promise<McpEntry[]> {
  const global = await detectGlobalMcps()
  const project = projectDir ? await detectProjectMcps(projectDir) : []

  // 合并去重，项目级优先
  const seen = new Set<string>()
  const result: McpEntry[] = []

  for (const entry of [...project, ...global]) {
    if (!seen.has(entry.name)) {
      seen.add(entry.name)
      result.push(entry)
    }
  }

  return result
}
