import { readGlobalSettings, readProjectSettings } from '../config/claude.js'

export type HookEntry = {
  event: string
  name: string
  scope: 'global' | 'project'
}

type RawHookItem = {
  hooks?: Record<string, unknown[]>
  [key: string]: unknown
}

function parseHooks(settings: Record<string, unknown>, scope: 'global' | 'project'): HookEntry[] {
  const hooks = settings['hooks']
  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
    return []
  }

  const result: HookEntry[] = []
  const hooksMap = hooks as Record<string, unknown>

  for (const event of Object.keys(hooksMap)) {
    const eventHooks = hooksMap[event]
    if (Array.isArray(eventHooks)) {
      eventHooks.forEach((hook, index) => {
        const hookObj = hook as Record<string, unknown>
        const name =
          typeof hookObj['matcher'] === 'string'
            ? hookObj['matcher']
            : typeof hookObj['name'] === 'string'
              ? hookObj['name']
              : `hook-${index}`
        result.push({ event, name, scope })
      })
    } else {
      // hooks field is a plain key-value object
      result.push({ event, name: event, scope })
    }
  }

  return result
}

export async function detectGlobalHooks(): Promise<HookEntry[]> {
  const settings = await readGlobalSettings()
  if (!settings) return []
  return parseHooks(settings, 'global')
}

export async function detectProjectHooks(projectDir: string): Promise<HookEntry[]> {
  const settings = await readProjectSettings(projectDir)
  if (!settings) return []
  return parseHooks(settings, 'project')
}
