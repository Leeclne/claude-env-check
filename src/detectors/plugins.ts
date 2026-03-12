import { join } from 'path'
import { readFile } from 'fs/promises'
import { getGlobalClaudeDir, readGlobalSettings } from '../config/claude.js'

export type PluginEntry = {
  name: string        // without marketplace suffix, e.g. "frontend-design"
  fullKey: string     // full key, e.g. "frontend-design@claude-plugins-official"
  marketplace: string
  scope: 'global' | 'project'
  enabled: boolean
}

type InstalledPlugin = {
  scope: string
  installPath: string
  version: string
  installedAt: string
}

type InstalledPluginsFile = {
  version: number
  plugins: Record<string, InstalledPlugin[]>
}

async function readInstalledPlugins(): Promise<InstalledPluginsFile | null> {
  const filePath = join(getGlobalClaudeDir(), 'plugins', 'installed_plugins.json')
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as InstalledPluginsFile
  } catch {
    return null
  }
}

export async function detectGlobalPlugins(): Promise<PluginEntry[]> {
  const installed = await readInstalledPlugins()
  if (!installed) return []

  const settings = await readGlobalSettings()
  const enabledMap = (settings?.['enabledPlugins'] ?? {}) as Record<string, boolean>

  const results: PluginEntry[] = []

  for (const [fullKey, installs] of Object.entries(installed.plugins)) {
    const atIndex = fullKey.lastIndexOf('@')
    const name = atIndex > 0 ? fullKey.slice(0, atIndex) : fullKey
    const marketplace = atIndex > 0 ? fullKey.slice(atIndex + 1) : ''

    // find user-scoped install record
    const userInstall = installs.find((i) => i.scope === 'user')
    if (!userInstall) continue

    const enabled = enabledMap[fullKey] !== false // 默认启用

    results.push({ name, fullKey, marketplace, scope: 'global', enabled })
  }

  return results
}

export async function detectProjectPlugins(projectDir: string): Promise<PluginEntry[]> {
  const filePath = join(projectDir, '.claude', 'plugins', 'installed_plugins.json')
  let installed: InstalledPluginsFile | null = null
  try {
    const raw = await readFile(filePath, 'utf-8')
    installed = JSON.parse(raw) as InstalledPluginsFile
  } catch {
    return []
  }

  const settingsPath = join(projectDir, '.claude', 'settings.json')
  let enabledMap: Record<string, boolean> = {}
  try {
    const raw = await readFile(settingsPath, 'utf-8')
    const s = JSON.parse(raw) as Record<string, unknown>
    enabledMap = (s['enabledPlugins'] ?? {}) as Record<string, boolean>
  } catch {
    // no project settings, ignore
  }

  const results: PluginEntry[] = []

  for (const [fullKey, installs] of Object.entries(installed.plugins)) {
    const atIndex = fullKey.lastIndexOf('@')
    const name = atIndex > 0 ? fullKey.slice(0, atIndex) : fullKey
    const marketplace = atIndex > 0 ? fullKey.slice(atIndex + 1) : ''

    const projectInstall = installs.find((i) => i.scope === 'project')
    if (!projectInstall) continue

    const enabled = enabledMap[fullKey] !== false

    results.push({ name, fullKey, marketplace, scope: 'project', enabled })
  }

  return results
}
