import { detectGlobalSkills, detectProjectSkills, type SkillEntry } from './skills.js'
import { detectAllMcps, type McpEntry } from './mcps.js'
import { detectGlobalHooks, detectProjectHooks, type HookEntry } from './hooks.js'
import { detectGlobalPlugins, detectProjectPlugins, type PluginEntry } from './plugins.js'

export type { SkillEntry, McpEntry, HookEntry, PluginEntry }

export type DetectionResult = {
  skills: SkillEntry[]
  mcps: McpEntry[]
  hooks: HookEntry[]
  plugins: PluginEntry[]
}

export async function detectAll(projectDir?: string): Promise<DetectionResult> {
  const globalSkills = await detectGlobalSkills()
  const projectSkills = projectDir ? await detectProjectSkills(projectDir) : []

  const seen = new Set<string>()
  const skills: SkillEntry[] = []
  for (const entry of [...projectSkills, ...globalSkills]) {
    if (!seen.has(entry.name)) {
      seen.add(entry.name)
      skills.push(entry)
    }
  }

  const mcps = await detectAllMcps(projectDir)

  const globalHooks = await detectGlobalHooks()
  const projectHooks = projectDir ? await detectProjectHooks(projectDir) : []

  const seenHooks = new Set<string>()
  const hooks: HookEntry[] = []
  for (const entry of [...projectHooks, ...globalHooks]) {
    const key = `${entry.event}:${entry.name}`
    if (!seenHooks.has(key)) {
      seenHooks.add(key)
      hooks.push(entry)
    }
  }

  const globalPlugins = await detectGlobalPlugins()
  const projectPlugins = projectDir ? await detectProjectPlugins(projectDir) : []

  const seenPlugins = new Set<string>()
  const plugins: PluginEntry[] = []
  for (const entry of [...projectPlugins, ...globalPlugins]) {
    if (!seenPlugins.has(entry.fullKey)) {
      seenPlugins.add(entry.fullKey)
      plugins.push(entry)
    }
  }

  return { skills, mcps, hooks, plugins }
}
