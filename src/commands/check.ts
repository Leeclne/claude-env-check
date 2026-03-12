import React from 'react'
import { render } from 'ink'
import { detectAll } from '../detectors/index.js'
import { readProfile } from '../config/profile.js'
import { CheckReport } from '../ui/CheckReport.js'
import type { SkillEntry, McpEntry, HookEntry, PluginEntry } from '../detectors/index.js'

type CheckItem<T> = T & { installed: boolean }

export async function runCheck(): Promise<void> {
  const profile = await readProfile()

  if (!profile) {
    console.error('\n❌ 尚未初始化基线配置，请先运行：claude-env init\n')
    process.exit(1)
  }

  const projectDir = process.cwd()
  const detected = await detectAll(projectDir)

  const detectedSkillNames = new Set(detected.skills.map((s) => s.name))
  const detectedMcpNames = new Set(detected.mcps.map((m) => m.name))
  const detectedHookKeys = new Set(detected.hooks.map((h) => `${h.event}:${h.name}`))
  const detectedPluginKeys = new Set(detected.plugins.map((p) => p.fullKey))

  const skillItems: CheckItem<SkillEntry>[] = profile.skills.map((name) => {
    const found = detected.skills.find((s) => s.name === name)
    return { name, scope: found?.scope ?? 'global', installed: detectedSkillNames.has(name) }
  })

  const mcpItems: CheckItem<McpEntry>[] = profile.mcps.map((name) => {
    const found = detected.mcps.find((m) => m.name === name)
    return { name, scope: found?.scope ?? 'global', installed: detectedMcpNames.has(name) }
  })

  const hookItems: CheckItem<HookEntry>[] = profile.hooks.map((hookKey) => {
    const parts = hookKey.split(':')
    const event = parts[0] ?? hookKey
    const name = parts[1] ?? hookKey
    const key = `${event}:${name}`
    const found = detected.hooks.find((h) => `${h.event}:${h.name}` === key)
    return { event, name, scope: found?.scope ?? 'global', installed: detectedHookKeys.has(key) }
  })

  const pluginItems: CheckItem<PluginEntry>[] = (profile.plugins ?? []).map((fullKey) => {
    const found = detected.plugins.find((p) => p.fullKey === fullKey)
    const atIndex = fullKey.lastIndexOf('@')
    const name = atIndex > 0 ? fullKey.slice(0, atIndex) : fullKey
    const marketplace = atIndex > 0 ? fullKey.slice(atIndex + 1) : ''
    return {
      name,
      fullKey,
      marketplace,
      scope: found?.scope ?? 'global',
      enabled: found?.enabled ?? false,
      installed: detectedPluginKeys.has(fullKey),
    }
  })

  return new Promise((resolve) => {
    const { waitUntilExit } = render(
      React.createElement(CheckReport, {
        projectDir,
        skills: skillItems,
        mcps: mcpItems,
        hooks: hookItems,
        plugins: pluginItems,
      })
    )
    waitUntilExit().then(resolve)
  })
}
